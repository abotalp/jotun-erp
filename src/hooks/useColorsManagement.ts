import { useState, useEffect } from 'react'
import { db } from '@/lib/supabase'
import type { Color, ColorCollection } from '@/types/database'

export function useColorsList(search: string, family: string) {
  const [data, setData] = useState<Color[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    let query = db.colors()
      .select('*, collection:color_collections(name)')
      .eq('is_active', true)
      .order('color_code')
      .limit(200)

    if (search.length >= 1) {
      query = query.or(
        `color_code.ilike.%${search}%,color_name.ilike.%${search}%,color_name_ar.ilike.%${search}%`
      )
    }
    if (family) query = query.eq('color_family', family)

    query.then(({ data, error }) => {
      if (!error && data) setData(data as Color[])
      setLoading(false)
    })
  }, [search, family, refreshKey])

  return { data, loading, refresh: () => setRefreshKey(k => k + 1) }
}

export function useColorCollections() {
  const [data, setData] = useState<ColorCollection[]>([])

  useEffect(() => {
    db.color_collections()
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (!error && data) setData(data as ColorCollection[])
      })
  }, [])

  return data
}

export async function createColor(data: Partial<Color>) {
  try {
    const { error } = await db.colors().insert({ ...data, is_active: true })
    if (error) throw error
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function togglePopular(id: string, value: boolean) {
  await db.colors().update({ is_popular: value }).eq('id', id)
}