import { useState, useEffect } from 'react'
import { db } from '@/lib/supabase'
import type { Contractor } from '@/types/database'

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
  await db.contractors().update({ is_active: false }).eq('id', id)
}