import { useState, useEffect } from 'react'
import { db } from '@/lib/supabase'

export function useCashSummary() {
  const [data, setData] = useState<{ registers: any[]; movements: any[] }>({ registers: [], movements: [] })
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    Promise.all([
      db.cash_registers().select('*').eq('is_active', true),
      db.cash_movements().select('*').order('date', { ascending: false }).limit(200)
    ]).then(([reg, mov]) => {
      setData({ registers: reg.data ?? [], movements: mov.data ?? [] })
      setLoading(false)
    })
  }, [refreshKey])

  return { data, loading, refresh: () => setRefreshKey(k => k + 1) }
}

export function useExpenses() {
  const [data, setData] = useState<any[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    db.expenses()
      .select('*, category:expense_categories(name, icon)')
      .order('date', { ascending: false })
      .limit(200)
      .then(({ data }) => setData(data ?? []))
  }, [refreshKey])

  return { data, refresh: () => setRefreshKey(k => k + 1) }
}

export function useRevenues() {
  const [data, setData] = useState<any[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    db.revenues().select('*').order('date', { ascending: false }).limit(200)
      .then(({ data }) => setData(data ?? []))
  }, [refreshKey])

  return { data, refresh: () => setRefreshKey(k => k + 1) }
}

export function useExpenseCategories() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    db.expense_categories().select('*').order('name').then(({ data }) => setData(data ?? []))
  }, [])

  return data
}

export async function addExpense(data: any, userId?: string) {
  const { data: exp, error } = await db.expenses()
    .insert({ ...data, created_by: userId })
    .select().single()
  if (error) return { success: false, error: error.message }

  if (data.payment_method === 'cash') {
    const { data: reg } = await db.cash_registers().select('id, current_balance').eq('is_active', true).single()
    if (reg) {
      const newBal = (reg.current_balance ?? 0) - data.amount
      await db.cash_registers().update({ current_balance: newBal }).eq('id', reg.id)
      await db.cash_movements().insert({
        register_id: reg.id,
        movement_type: 'out',
        source: 'expense',
        reference_id: exp.id,
        amount: data.amount,
        balance_after: newBal,
        description: data.description,
        user_id: userId
      })
    }
  }
  return { success: true }
}

export async function addRevenue(data: any, userId?: string) {
  const { data: rev, error } = await db.revenues()
    .insert({ ...data, created_by: userId })
    .select().single()
  if (error) return { success: false, error: error.message }

  const { data: reg } = await db.cash_registers().select('id, current_balance').eq('is_active', true).single()
  if (reg) {
    const newBal = (reg.current_balance ?? 0) + data.amount
    await db.cash_registers().update({ current_balance: newBal }).eq('id', reg.id)
    await db.cash_movements().insert({
      register_id: reg.id,
      movement_type: 'in',
      source: 'revenue',
      reference_id: rev.id,
      amount: data.amount,
      balance_after: newBal,
      description: `${data.source}: ${data.description}`,
      user_id: userId
    })
  }
  return { success: true }
}

// 🆕 إيداع أو سحب يدوي من الخزينة
export async function cashAdjustment(
  type: 'in' | 'out',
  amount: number,
  description: string,
  userId?: string
) {
  try {
    const { data: reg } = await db.cash_registers()
      .select('id, current_balance')
      .eq('is_active', true)
      .single()

    if (!reg) throw new Error('لا يوجد خزينة نشطة')

    if (type === 'out' && (reg.current_balance ?? 0) < amount) {
      throw new Error('الرصيد في الخزينة غير كافي')
    }

    const newBal = type === 'in'
      ? (reg.current_balance ?? 0) + amount
      : (reg.current_balance ?? 0) - amount

    await db.cash_registers().update({ current_balance: newBal }).eq('id', reg.id)

    await db.cash_movements().insert({
      register_id: reg.id,
      movement_type: type,
      source: 'adjustment',
      amount,
      balance_after: newBal,
      description,
      user_id: userId
    })

    return { success: true, newBalance: newBal }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// 🆕 جلب تقرير الفترة (للأرباح والخسائر)
export async function getProfitLossReport(dateFrom: string, dateTo: string) {
  const startISO = `${dateFrom}T00:00:00`
  const endISO = `${dateTo}T23:59:59`

  // 1. المبيعات
  const { data: sales } = await db.sales()
    .select('total, paid, subtotal, discount_amount, tax_amount, items:sale_items(profit, cost_price, quantity)')
    .eq('status', 'completed')
    .gte('date', startISO)
    .lte('date', endISO)

  // 2. المرتجعات
  const { data: returns } = await db.sale_returns()
    .select('total_amount')
    .gte('date', startISO)
    .lte('date', endISO)

  // 3. المصروفات حسب التصنيف
  const { data: expenses } = await db.expenses()
    .select('amount, category:expense_categories(name, icon)')
    .gte('date', dateFrom)
    .lte('date', dateTo)

  // 4. الإيرادات الأخرى
  const { data: revenues } = await db.revenues()
    .select('amount, source')
    .gte('date', dateFrom)
    .lte('date', dateTo)

  // الحسابات
  const totalSales = (sales ?? []).reduce((s: number, r: any) => s + (r.total ?? 0), 0)
  const totalReturns = (returns ?? []).reduce((s: number, r: any) => s + (r.total_amount ?? 0), 0)
  const netSales = totalSales - totalReturns

  const totalCost = (sales ?? []).reduce((s: number, sale: any) => {
    return s + (sale.items ?? []).reduce((sm: number, i: any) =>
      sm + ((i.cost_price ?? 0) * (i.quantity ?? 0)), 0)
  }, 0)

  const grossProfit = netSales - totalCost

  const totalExpenses = (expenses ?? []).reduce((s: number, e: any) => s + e.amount, 0)
  const totalOtherRevenue = (revenues ?? []).reduce((s: number, r: any) => s + r.amount, 0)

  const netProfit = grossProfit - totalExpenses + totalOtherRevenue
  const salesCount = (sales ?? []).length

  // تجميع المصروفات حسب التصنيف
  const expensesByCategory: Record<string, { name: string; icon: string; amount: number }> = {}
  ;(expenses ?? []).forEach((e: any) => {
    const key = e.category?.name ?? 'غير مصنف'
    if (!expensesByCategory[key]) {
      expensesByCategory[key] = { name: key, icon: e.category?.icon ?? '💰', amount: 0 }
    }
    expensesByCategory[key].amount += e.amount
  })

  return {
    totalSales,
    totalReturns,
    netSales,
    totalCost,
    grossProfit,
    totalExpenses,
    totalOtherRevenue,
    netProfit,
    salesCount,
    expensesByCategory: Object.values(expensesByCategory).sort((a, b) => b.amount - a.amount),
    profitMargin: netSales > 0 ? ((netProfit / netSales) * 100) : 0
  }
}
