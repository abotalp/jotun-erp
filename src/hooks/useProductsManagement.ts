import { useState, useEffect } from 'react'
import { db } from '@/lib/supabase'
import type { Product, ProductVariant, Brand } from '@/types/database'

export function useProductsList(search: string, categoryId: string) {
  const [data, setData] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    let query = db.products()
      .select(`
        *,
        category:categories(id, name, color_hex),
        brand:brands(id, name),
        variants:product_variants(
          *,
          inventory(quantity, warehouse_id, avg_cost)
        )
      `)
      .eq('is_active', true)
      .order('name')

    if (search.length >= 2) query = query.ilike('name', `%${search}%`)
    if (categoryId) query = query.eq('category_id', categoryId)

    query.then(({ data, error }) => {
      if (!error && data) setData(data as Product[])
      setLoading(false)
    })
  }, [search, categoryId, refreshKey])

  return {
    data,
    loading,
    refresh: () => setRefreshKey(k => k + 1)
  }
}

export function useBrands() {
  const [data, setData] = useState<Brand[]>([])

  useEffect(() => {
    db.brands()
      .select('*')
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (!error && data) setData(data as Brand[])
      })
  }, [])

  return data
}

export async function createProduct(payload: {
  product: Partial<Product>
  variants: Partial<ProductVariant>[]
  defaultWarehouseId?: string
}) {
  try {
    const { data: prod, error: pErr } = await db.products()
      .insert({ ...payload.product, is_active: true })
      .select()
      .single()
    if (pErr) throw pErr

    if (payload.variants.length > 0) {
      const vars = payload.variants.map((v, i) => ({
        ...v,
        product_id: prod.id,
        is_active: true,
        sort_order: i
      }))
      const { data: insertedVars, error: vErr } = await db.product_variants()
        .insert(vars)
        .select()
      if (vErr) throw vErr

      // Create inventory records
      if (payload.defaultWarehouseId && insertedVars) {
        const invRows = insertedVars.map((v: any) => ({
          variant_id: v.id,
          warehouse_id: payload.defaultWarehouseId!,
          quantity: 0,
          avg_cost: v.cost_price ?? 0
        }))
        await db.inventory().insert(invRows)
      }
    }

    return { success: true, product: prod }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  try {
    const { error } = await db.products()
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function deleteProduct(id: string) {
  try {
    const { error } = await db.products()
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function addVariant(
  productId: string,
  data: Partial<ProductVariant>,
  defaultWarehouseId?: string
) {
  try {
    const { data: v, error } = await db.product_variants()
      .insert({ ...data, product_id: productId, is_active: true })
      .select()
      .single()
    if (error) throw error

    if (defaultWarehouseId) {
      await db.inventory().insert({
        variant_id: v.id,
        warehouse_id: defaultWarehouseId,
        quantity: 0,
        avg_cost: data.cost_price ?? 0
      })
    }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updateVariant(id: string, updates: Partial<ProductVariant>) {
  try {
    const { error } = await db.product_variants()
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
