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

  return {
    data,
    loading,
    refresh: () => setRefreshKey(k => k + 1)
  }
}

export function useCustomerTransactions(customerId: string | null) {
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
      .order('date', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error && data) setData(data)
        setLoading(false)
      })
  }, [customerId])

  return { data, loading }
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
        variant:product_variants(
          size_name,
          product:products(name)
        )
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
    // Generate code
    const { count } = await db.customers()
      .select('id', { count: 'exact', head: true })
    const code = `CUS-${String((count ?? 0) + 1).padStart(5, '0')}`

    const { error } = await db.customers()
      .insert({ ...data, code, is_active: true })
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
    const { error } = await db.customers()
      .update({ is_active: false })
      .eq('id', id)
    if (error) throw error
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}