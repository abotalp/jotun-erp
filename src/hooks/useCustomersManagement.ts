import { useState, useEffect } from 'react'
import { db } from '@/lib/supabase'
import type { Customer } from '@/types/database'

export function useCustomersList(search: string, typeFilter: string) {
  const [data, setData] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    let query = db.customers()
      .select('*')
      .eq('is_active', true)
      .order('name')
      .limit(300)

    if (search.length >= 2) {
      query = query.or(
        `name.ilike.%${search}%,phone.ilike.%${search}%,mobile.ilike.%${search}%,code.ilike.%${search}%`
      )
    }
    if (typeFilter) query = query.eq('customer_type', typeFilter)

    query.then(({ data, error }) => {
      if (!error && data) setData(data as Customer[])
      setLoading(false)
    })
  }, [search, typeFilter, refreshKey])

  return { data, loading, refresh: () => setRefreshKey(k => k + 1) }
}

// ✅ إصلاح: جلب الفواتير مباشرة من sales مع كل البنود
export function useCustomerInvoices(customerId: string | null) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!customerId) { setData([]); return }
    setLoading(true)

    db.sales()
      .select(`
        id, invoice_no, date, total, paid, remaining, status,
        is_tax_invoice, subtotal, discount_amount, tax_rate, tax_amount,
        payment_method,
        items:sale_items(
          id, product_name, size_name, quantity, unit_price, total,
          color:sale_item_colors(color_code, color_name, hex_value)
        )
      `)
      .eq('customer_id', customerId)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Invoices error:', error)
        if (!error && data) setData(data)
        setLoading(false)
      })
  }, [customerId])

  return { data, loading }
}

// ✅ إصلاح: جلب المدفوعات من sale_payments عبر العلاقة بـ sales
export function useCustomerPayments(customerId: string | null) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!customerId) { setData([]); return }
    setLoading(true)

    // أولاً نجلب IDs الفواتير للعميل
    db.sales()
      .select('id, invoice_no')
      .eq('customer_id', customerId)
      .then(async ({ data: salesData, error: salesErr }) => {
        if (salesErr || !salesData || salesData.length === 0) {
          setData([])
          setLoading(false)
          return
        }

        const saleIds = salesData.map((s: any) => s.id)
        const salesMap: Record<string, string> = {}
        salesData.forEach((s: any) => { salesMap[s.id] = s.invoice_no })

        // ثم نجلب الدفعات لهذه الفواتير
        const { data: paymentsData, error: payErr } = await db.sale_payments()
          .select('*')
          .in('sale_id', saleIds)
          .order('date', { ascending: false })

        if (payErr) console.error('Payments error:', payErr)

        const enriched = (paymentsData ?? []).map((p: any) => ({
          ...p,
          invoice_no: salesMap[p.sale_id] ?? '-'
        }))

        setData(enriched)
        setLoading(false)
      })
  }, [customerId])

  return { data, loading }
}

// ✅ إصلاح: كشف الحساب يُبنى من sales + sale_payments مباشرة (ليس من customer_transactions)
export function useCustomerLedger(customerId: string | null) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!customerId) { setData([]); return }
    setLoading(true)

    Promise.all([
      db.sales()
        .select('id, invoice_no, date, total, status')
        .eq('customer_id', customerId)
        .order('date', { ascending: true }),
      (async () => {
        const { data: sales } = await db.sales()
          .select('id, invoice_no')
          .eq('customer_id', customerId)
        if (!sales || sales.length === 0) return { data: [], error: null }
        const saleIds = sales.map((s: any) => s.id)
        const salesMap: Record<string, string> = {}
        sales.forEach((s: any) => { salesMap[s.id] = s.invoice_no })
        const { data: payments } = await db.sale_payments()
          .select('*')
          .in('sale_id', saleIds)
          .order('date', { ascending: true })
        return {
          data: (payments ?? []).map((p: any) => ({ ...p, invoice_no: salesMap[p.sale_id] ?? '-' })),
          error: null
        }
      })(),
      db.sale_returns()
        .select(`id, return_no, sale_id, date, total_amount, sale:sales!inner(customer_id, invoice_no)`)
        .eq('sale.customer_id', customerId)
    ]).then(([salesRes, paymentsRes, returnsRes]) => {
      const sales = salesRes.data ?? []
      const payments = paymentsRes.data ?? []
      const returns = returnsRes.data ?? []

      // بناء قائمة الحركات
      const transactions: any[] = []

      sales.forEach((s: any) => {
        if (s.status !== 'cancelled') {
          transactions.push({
            id: `sale-${s.id}`,
            date: s.date,
            type: 'sale',
            reference_no: s.invoice_no,
            debit: s.total,
            credit: 0,
            description: 'فاتورة بيع'
          })
        }
      })

      payments.forEach((p: any) => {
        transactions.push({
          id: `payment-${p.id}`,
          date: p.date,
          type: 'payment',
          reference_no: p.invoice_no,
          debit: 0,
          credit: p.amount,
          description: `دفعة - ${p.payment_method === 'cash' ? 'نقدي' : p.payment_method}`
        })
      })

      returns.forEach((r: any) => {
        transactions.push({
          id: `return-${r.id}`,
          date: r.date,
          type: 'return',
          reference_no: r.return_no,
          debit: 0,
          credit: r.total_amount,
          description: `مرتجع - فاتورة ${r.sale?.invoice_no}`
        })
      })

      // ترتيب زمني تصاعدي لحساب الرصيد
      transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      let runningBalance = 0
      const ledger = transactions.map(t => {
        runningBalance += t.debit - t.credit
        return { ...t, balance: runningBalance }
      })

      // عرض الأحدث أولاً
      setData(ledger.reverse())
      setLoading(false)
    })
  }, [customerId])

  return { data, loading }
}

// ✅ إصلاح: الإحصائيات تعتمد على sales و sale_payments مباشرة
export function useCustomerStats(customerId: string | null) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!customerId) { setStats(null); return }
    setLoading(true)

    Promise.all([
      db.sales()
        .select('id, total, paid, date, status')
        .eq('customer_id', customerId),
      (async () => {
        const { data: sales } = await db.sales().select('id').eq('customer_id', customerId)
        if (!sales || sales.length === 0) return []
        const saleIds = sales.map((s: any) => s.id)
        const { data } = await db.sale_payments()
          .select('amount, date')
          .in('sale_id', saleIds)
        return data ?? []
      })()
    ]).then(([salesRes, payments]) => {
      const sales = (salesRes.data ?? []).filter((s: any) => s.status === 'completed')

      const totalSales = sales.reduce((s: number, x: any) => s + (x.total ?? 0), 0)
      const totalPaid = payments.reduce((s: number, x: any) => s + (x.amount ?? 0), 0)
      const debt = totalSales - totalPaid

      const lastSale = sales.length > 0
        ? sales.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        : null
      const lastPayment = payments.length > 0
        ? payments.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        : null

      setStats({
        totalSales,
        totalPaid,
        debt,
        invoicesCount: sales.length,
        lastSaleDate: lastSale?.date ?? null,
        lastPaymentDate: lastPayment?.date ?? null
      })
      setLoading(false)
    })
  }, [customerId])

  return { stats, loading }
}

export function useCustomerColorHistory(customerId: string | null) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!customerId) { setData([]); return }
    setLoading(true)
    db.customer_color_history()
      .select(`
        *,
        color:colors(id, color_code, color_name, color_name_ar, hex_value),
        variant:product_variants(size_name, product:products(name))
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data, error }) => {
        if (!error && data) setData(data)
        setLoading(false)
      })
  }, [customerId])

  return { data, loading }
}

export async function createCustomer(data: Partial<Customer>) {
  try {
    const { count } = await db.customers().select('id', { count: 'exact', head: true })
    const code = `CUS-${String((count ?? 0) + 1).padStart(5, '0')}`
    const { error } = await db.customers().insert({ ...data, code, is_active: true })
    if (error) throw error
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updateCustomer(id: string, updates: Partial<Customer>) {
  try {
    const { error } = await db.customers()
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function deleteCustomer(id: string) {
  try {
    const { error } = await db.customers().update({ is_active: false }).eq('id', id)
    if (error) throw error
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function getInvoiceForReprint(saleId: string) {
  try {
    const { data: sale, error } = await db.sales()
      .select(`
        *,
        customer:customers(name, phone),
        items:sale_items(
          id, product_name, size_name, quantity, unit_price, total,
          color:sale_item_colors(color_code, color_name)
        )
      `)
      .eq('id', saleId)
      .single()

    if (error || !sale) throw error || new Error('الفاتورة غير موجودة')

    return {
      success: true,
      invoice: {
        invoice_no: sale.invoice_no,
        date: sale.date,
        is_tax_invoice: sale.is_tax_invoice,
        subtotal: sale.subtotal,
        discount_amount: sale.discount_amount,
        tax_rate: sale.tax_rate,
        tax_amount: sale.tax_amount,
        total: sale.total,
        paid: sale.paid,
        remaining: sale.remaining,
        customer_name: (sale.customer as any)?.name ?? null,
        customer_phone: (sale.customer as any)?.phone ?? null,
        items: (sale.items as any[]).map(item => ({
          product_name: item.product_name,
          size_name: item.size_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
          color_code: item.color?.[0]?.color_code ?? null,
          color_name: item.color?.[0]?.color_name ?? null
        }))
      }
    }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
