import { useEffect, useState } from 'react'
import { db } from '@/lib/supabase'
import type { Category, ProductVariant, Color, Customer } from '@/types/database'

export function useCategories() {
  const [data, setData] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.categories()
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (!error && data) setData(data as Category[])
        setLoading(false)
      })
  }, [])

  return { data, loading }
}

export function usePosVariants(search: string, categoryId: string | null) {
  const [data, setData] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    let query = db.product_variants()
      .select(`
        id, size_name, barcode, sku, cost_price, sale_price, min_stock, image_url, product_id,
        product:products!inner(id, name, is_tintable, main_image_url, category_id, is_active),
        inventory(quantity, warehouse_id)
      `)
      .eq('is_active', true)
      .eq('product.is_active', true)
      .order('sale_price')
      .limit(100)

    if (search.length >= 2) {
      query = query.or(`barcode.eq.${search},sku.ilike.%${search}%`)
    }
    if (categoryId) {
      query = query.eq('product.category_id', categoryId)
    }

    query.then(({ data, error }) => {
      if (!error && data) {
        let filtered = data as any[]
        if (search.length >= 2) {
          const term = search.toLowerCase()
          filtered = filtered.filter((v: any) =>
            v.product?.name?.toLowerCase().includes(term) ||
            v.barcode === search ||
            v.sku?.toLowerCase().includes(term)
          )
        }
        setData(filtered as ProductVariant[])
      }
      setLoading(false)
    })
  }, [search, categoryId])

  return { data, loading }
}

export function useColors(search: string) {
  const [data, setData] = useState<Color[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    let query = db.colors()
      .select('*, collection:color_collections(name)')
      .eq('is_active', true)
      .order('color_code')
      .limit(60)

    if (search.length >= 1) {
      query = query.or(
        `color_code.ilike.%${search}%,color_name.ilike.%${search}%,color_name_ar.ilike.%${search}%`
      )
    }

    query.then(({ data, error }) => {
      if (!error && data) setData(data as Color[])
      setLoading(false)
    })
  }, [search])

  return { data, loading }
}

export function useCustomers(search: string) {
  const [data, setData] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    let query = db.customers()
      .select('*')
      .eq('is_active', true)
      .order('name')
      .limit(30)

    if (search.length >= 1) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,code.ilike.%${search}%`)
    }

    query.then(({ data, error }) => {
      if (!error && data) setData(data as Customer[])
      setLoading(false)
    })
  }, [search])

  return { data, loading }
}