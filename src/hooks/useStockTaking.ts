import { useState, useEffect } from 'react'
import { db } from '@/lib/supabase'

export function useStockSearch(search: string, categoryId: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (search.length < 1 && !categoryId) {
      setData([])
      return
    }

    setLoading(true)

    let query = db.product_variants()
      .select(`
        id, size_name, sku, barcode, cost_price, sale_price, min_stock,
        product:products!inner(id, name, is_active, category_id, category:categories(name)),
        inventory(id, quantity, warehouse_id)
      `)
      .eq('is_active', true)
      .eq('product.is_active', true)
      .order('sku')
      .limit(200)

    if (categoryId) {
      query = query.eq('product.category_id', categoryId)
    }

    query.then(({ data: variants, error }) => {
      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      let result = (variants ?? []) as any[]

      if (search.length >= 1) {
        const term = search.toLowerCase().trim()
        result = result.filter((v: any) => {
          const name = v.product?.name?.toLowerCase() ?? ''
          const sku = v.sku?.toLowerCase() ?? ''
          const size = v.size_name?.toLowerCase() ?? ''
          const barcode = v.barcode ?? ''
          return name.includes(term) ||
                 sku.includes(term) ||
                 size.includes(term) ||
                 barcode === search
        })
      }

      setData(result)
      setLoading(false)
    })
  }, [search, categoryId, refreshKey])

  return { data, loading, refresh: () => setRefreshKey(k => k + 1) }
}

export async function updateStock(
  variantId: string,
  warehouseId: string,
  newQuantity: number,
  oldQuantity: number,
  costPrice: number,
  userId?: string
) {
  try {
    const { data: existing } = await db.inventory()
      .select('id')
      .eq('variant_id', variantId)
      .eq('warehouse_id', warehouseId)
      .maybeSingle()

    if (existing) {
      const { error } = await db.inventory()
        .update({ quantity: newQuantity, last_updated: new Date().toISOString() })
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await db.inventory()
        .insert({
          variant_id: variantId,
          warehouse_id: warehouseId,
          quantity: newQuantity,
          avg_cost: costPrice
        })
      if (error) throw error
    }

    const diff = newQuantity - oldQuantity
    if (diff !== 0) {
      await db.inventory_movements().insert({
        variant_id: variantId,
        warehouse_id: warehouseId,
        movement_type: diff > 0 ? 'adjustment_add' : 'adjustment_sub',
        reference_type: 'stock_taking',
        quantity: diff,
        unit_cost: costPrice,
        qty_before: oldQuantity,
        qty_after: newQuantity,
        notes: 'جرد سريع',
        user_id: userId
      })
    }

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
