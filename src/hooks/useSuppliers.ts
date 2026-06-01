import { useState, useEffect } from 'react'
import { db } from '@/lib/supabase'
import type { Supplier } from '@/types/database'

export function useSuppliersList(search: string) {
  const [data, setData] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    let q = db.suppliers().select('*').eq('is_active', true).order('name')
    if (search.length >= 2) q = q.ilike('name', `%${search}%`)
    q.then(({ data, error }) => {
      if (!error && data) setData(data as Supplier[])
      setLoading(false)
    })
  }, [search, refreshKey])

  return { data, loading, refresh: () => setRefreshKey(k => k + 1) }
}

export function useSupplierTransactions(supplierId: string | null) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    if (!supplierId) return
    db.supplier_transactions()
      .select('*')
      .eq('supplier_id', supplierId)
      .order('date', { ascending: false })
      .limit(30)
      .then(({ data }) => setData(data ?? []))
  }, [supplierId])

  return data
}

export async function createSupplier(data: any) {
  try {
    const { count } = await db.suppliers().select('id', { count: 'exact', head: true })
    const code = `SUP-${String((count ?? 0) + 1).padStart(5, '0')}`
    const { error } = await db.suppliers().insert({ ...data, code, is_active: true })
    if (error) throw error
    return { success: true }
  } catch (e: any) { return { success: false, error: e.message } }
}

export async function deleteSupplier(id: string) {
  await db.suppliers().update({ is_active: false }).eq('id', id)
}