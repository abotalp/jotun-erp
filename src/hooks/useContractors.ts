import { useState, useEffect } from 'react'
import { db } from '@/lib/supabase'
import type { Contractor } from '@/types/database'

// ═══ قائمة الصنايعية ═══
export function useContractorsList(search: string, typeFilter: string) {
  const [data, setData] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    let q = db.contractors().select('*').eq('is_active', true).order('name')
    if (search.length >= 2) q = q.ilike('name', `%${search}%`)
    if (typeFilter) q = q.eq('type', typeFilter)
    q.then(({ data, error }) => {
      if (!error && data) setData(data as Contractor[])
      setLoading(false)
    })
  }, [search, typeFilter, refreshKey])

  return { data, loading, refresh: () => setRefreshKey(k => k + 1) }
}

// ═══ إضافة صنايعي جديد ═══
export async function createContractor(data: any) {
  try {
    const { count } = await db.contractors().select('id', { count: 'exact', head: true })
    const prefix = data.type === 'engineer' ? 'ENG' : data.type === 'foreman' ? 'FRM' : 'CON'
    const code = `${prefix}-${String((count ?? 0) + 1).padStart(5, '0')}`
    const { error } = await db.contractors().insert({ ...data, code, is_active: true })
    if (error) throw error
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function deleteContractor(id: string) {
  const { error } = await db.contractors().update({ is_active: false }).eq('id', id)
  return error ? { success: false, error: error.message } : { success: true }
}

// ═══ فواتير الصنايعي ═══
export function useContractorInvoices(contractorId: string | null) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!contractorId) { setData([]); return }
    setLoading(true)
    db.sales()
      .select(`
        id, invoice_no, date, total, paid, remaining, status,
        customer:customers(name),
        items:sale_items(product_name, quantity, unit_price, total)
      `)
      .eq('contractor_id', contractorId)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setData(data)
        setLoading(false)
      })
  }, [contractorId])

  return { data, loading }
}

// ═══ كشف حساب الصنايعي (العمولات) ═══
export function useContractorLedger(contractorId: string | null) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!contractorId) { setData([]); return }
    setLoading(true)

    db.contractor_commissions()
      .select('*, sale:sales(invoice_no, date, customer:customers(name))')
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Ledger error:', error)
        if (!error && data) {
          let running = 0
          const ledger = data.map((t: any) => {
            running += (t.status === 'paid' ? -t.commission_amount : t.commission_amount)
            return {
              ...t,
              debit: t.commission_amount,
              credit: t.status === 'paid' ? t.commission_amount : 0,
              balance: running
            }
          }).reverse()
          setData(ledger)
        }
        setLoading(false)
      })
  }, [contractorId])

  return { data, loading }
}

// ═══ إحصائيات الصنايعي ═══
export function useContractorStats(contractorId: string | null) {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (!contractorId) { setStats(null); return }

    db.contractor_commissions()
      .select('commission_amount, status, sale:sales(invoice_no, date)')
      .eq('contractor_id', contractorId)
      .then(({ data }) => {
        const commissions = data ?? []
        const total = commissions.reduce((s: number, c: any) => s + (c.commission_amount ?? 0), 0)
        const paid = commissions.filter((c: any) => c.status === 'paid')
          .reduce((s: number, c: any) => s + (c.commission_amount ?? 0), 0)
        const pending = total - paid
        const invoicesCount = commissions.length

        const lastSale = commissions.length > 0
          ? commissions.sort((a: any, b: any) => new Date(b.sale?.date ?? 0).getTime() - new Date(a.sale?.date ?? 0).getTime())[0]
          : null

        const lastPaid = commissions.filter((c: any) => c.status === 'paid')
          .sort((a: any, b: any) => new Date(b.paid_date ?? 0).getTime() - new Date(a.paid_date ?? 0).getTime())[0]

        setStats({ total, paid, pending, invoicesCount, lastSaleDate: lastSale?.sale?.date ?? null, lastPaidDate: lastPaid?.paid_date ?? null })
      })
  }, [contractorId])

  return stats
}

// ═══ سداد عمولة للصنايعي ═══
export async function payContractorCommission(
  commissionId: string,
  amount: number,
  userId?: string
) {
  try {
    // تحديث حالة العمولة
    const { error: commErr } = await db.contractor_commissions()
      .update({ status: 'paid', paid_date: new Date().toISOString().slice(0, 10) })
      .eq('id', commissionId)
    if (commErr) throw commErr

    // جلب بيانات الصنايعي
    const { data: comm } = await db.contractor_commissions()
      .select('contractor_id, commission_amount')
      .eq('id', commissionId)
      .single()

    if (comm) {
      // تحديث رصيد الصنايعي
      const { data: cont } = await db.contractors()
        .select('total_commissions_paid, balance_due')
        .eq('id', comm.contractor_id)
        .single()

      if (cont) {
        await db.contractors()
          .update({
            total_commissions_paid: (cont.total_commissions_paid ?? 0) + amount,
            balance_due: Math.max(0, (cont.balance_due ?? 0) - amount)
          })
          .eq('id', comm.contractor_id)
      }

      // خصم من الخزينة
      const { data: reg } = await db.cash_registers()
        .select('id, current_balance')
        .eq('is_active', true)
        .single()

      if (reg) {
        const newBal = (reg.current_balance ?? 0) - amount
        await db.cash_registers().update({ current_balance: newBal }).eq('id', reg.id)
        await db.cash_movements().insert({
          register_id: reg.id,
          movement_type: 'out',
          source: 'adjustment',
          amount,
          balance_after: newBal,
          description: `سداد عمولة صنايعي - ${commissionId}`,
          user_id: userId
        })
      }
    }

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ═══ حفظ عمولة مع الفاتورة ═══
export async function saveContractorCommission(
  contractorId: string,
  saleId: string,
  saleAmount: number,
  commissionType: string,
  commissionValue: number
) {
  try {
    let commissionAmount = 0
    if (commissionType === 'percentage') {
      commissionAmount = (saleAmount * commissionValue) / 100
    } else {
      commissionAmount = commissionValue
    }

    if (commissionAmount <= 0) return { success: true }

    const { error } = await db.contractor_commissions().insert({
      contractor_id: contractorId,
      sale_id: saleId,
      sale_amount: saleAmount,
      commission_rate: commissionType === 'percentage' ? commissionValue : 0,
      commission_amount: commissionAmount,
      status: 'pending'
    })
    if (error) throw error

    // تحديث إجماليات الصنايعي
    const { data: cont } = await db.contractors()
      .select('total_commissions_earned, balance_due')
      .eq('id', contractorId).single()

    if (cont) {
      await db.contractors().update({
        total_commissions_earned: (cont.total_commissions_earned ?? 0) + commissionAmount,
        balance_due: (cont.balance_due ?? 0) + commissionAmount
      }).eq('id', contractorId)
    }

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
