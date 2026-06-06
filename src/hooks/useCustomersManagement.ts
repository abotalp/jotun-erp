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
    if (typeFilter) {
      query = query.eq('customer_type', typeFilter)
    }

    query.then(({ data, error }) => {
      if (!error && data) setData(data as Customer[])
      setLoading(false)
    })
  }, [search, typeFilter, refreshKey])

  return { data, loading, refresh: () => setRefreshKey(k => k + 1) }
}

// 🆕 جلب فواتير العميل بالتفاصيل
export function useCustomerInvoices(customerId: string | null) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!customerId) {
      setData([])
      return
    }
    setLoading(true)
    db.sales()
      .select(`
        *,
        items:sale_items(
          id, product_name, size_name, quantity, unit_price, total, cost_price, profit,
          color:sale_item_colors(color_code, color_name, hex_value)
        ),
        payments:sale_payments(*)
      `)
      .eq('customer_id', customerId)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setData(data)
        setLoading(false)
      })
  }, [customerId])

  return { data, loading }
}

// 🆕 جلب مدفوعات العميل
export function useCustomerPayments(customerId: string | null) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!customerId) {
      setData([])
      return
    }
    setLoading(true)
    db.sale_payments()
      .select(`*, sale:sales!inner(invoice_no, customer_id)`)
      .eq('sale.customer_id', customerId)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setData(data)
        setLoading(false)
      })
  }, [customerId])

  return { data, loading }
}

// 🆕 كشف الحساب الكامل (Ledger)
export function useCustomerLedger(customerId: string | null) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!customerId) {
      setData([])
      return
    }
    setLoading(true)
    db.customer_transactions()
      .select('*')
      .eq('customer_id', customerId)
      .order('date', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          // حساب الرصيد التراكمي
          let runningBalance = 0
          const ledger = data.map((t: any) => {
            runningBalance += (t.amount ?? 0)
            return {
              ...t,
              debit: t.amount > 0 ? t.amount : 0,
              credit: t.amount < 0 ? Math.abs(t.amount) : 0,
              balance: runningBalance
            }
          })
          // اعرض الأحدث أولاً
          setData(ledger.reverse())
        }
        setLoading(false)
      })
  }, [customerId])

  return { data, loading }
}

// 🆕 إحصائيات العميل
export function useCustomerStats(customerId: string | null) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!customerId) {
      setStats(null)
      return
    }
    setLoading(true)

    Promise.all([
      db.sales().select('id, total, paid, date').eq('customer_id', customerId).eq('status', 'completed'),
      db.sale_payments().select('amount, date, sale:sales!inner(customer_id)').eq('sale.customer_id', customerId)
    ]).then(([salesRes, paymentsRes]) => {
      const sales = salesRes.data ?? []
      const payments = paymentsRes.data ?? []

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
    if (!customerId) {
      setData([])
      return
    }
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

// 🆕 جلب فاتورة كاملة لإعادة الطباعة
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
