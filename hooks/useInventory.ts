import { useState, useEffect } from 'react'
import { db } from '@/lib/supabase'

export function useInventoryList(search: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    db.inventory()
      .select(`
        *,
        variant:product_variants(
          id, size_name, barcode, sku, min_stock, sale_price, cost_price,
          product:products(id, name, main_image_url, category:categories(name))
        ),
        warehouse:warehouses(id, name)
      `)
      .order('quantity')
      .then(({ data, error }) => {
        if (!error && data) {
          let result = data
          if (search.length >= 2) {
            const term = search.toLowerCase()
            result = result.filter((i: any) =>
              i.variant?.product?.name?.toLowerCase().includes(term) ||
              i.variant?.sku?.toLowerCase().includes(term) ||
              i.variant?.barcode?.includes(search)
            )
          }
          setData(result)
        }
        setLoading(false)
      })
  }, [search])

  return { data, loading }
}

export function useInventoryMovements() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.inventory_movements()
      .select(`
        *,
        variant:product_variants(size_name, product:products(name)),
        warehouse:warehouses(name)
      `)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!error && data) setData(data)
        setLoading(false)
      })
  }, [])

  return { data, loading }
}