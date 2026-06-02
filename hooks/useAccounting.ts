import { useState, useEffect } from 'react'
import { db } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'

export function useCashSummary() {
  const [data, setData] = useState<{ registers: any[]; movements: any[] }>({ registers: [], movements: [] })
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    Promise.all([
      db.cash_registers().select('*').eq('is_active', true),
      db.cash_movements().select('*').order('date', { ascending: false }).limit(100)
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
      .limit(100)
      .then(({ data }) => setData(data ?? []))
  }, [refreshKey])

  return { data, refresh: () => setRefreshKey(k => k + 1) }
}

export function useRevenues() {
  const [data, setData] = useState<any[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    db.revenues().select('*').order('date', { ascending: false }).limit(100)
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
        register_id: reg.id, movement_type: 'out', source: 'expense',
        reference_id: exp.id, amount: data.amount, balance_after: newBal,
        description: data.description, user_id: userId
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
      register_id: reg.id, movement_type: 'in', source: 'revenue',
      reference_id: rev.id, amount: data.amount, balance_after: newBal,
      description: `${data.source}: ${data.description}`, user_id: userId
    })
  }
  return { success: true }
}