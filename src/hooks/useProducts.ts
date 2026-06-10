import { useEffect, useState, useRef, useMemo } from 'react'
import { db } from '@/lib/supabase'
import type { Category, ProductVariant, Color, Customer } from '@/types/database'

let cachedCategories: Category[] | null = null

export function useCategories() {
  const [data, setData] = useState<Category[]>(cachedCategories ?? [])
  const [loading, setLoading] = useState(!cachedCategories)

  useEffect(() => {
    if (cachedCategories) {
      setData(cachedCategories)
      setLoading(false)
      return
    }
    let mounted = true
    db.categories()
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (!mounted) return
        if (!error && data) {
          cachedCategories = data as Category[]
          setData(cachedCategories)
        }
        setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  return { data, loading }
}

// ✅ نفس طريقة الفواتير المفتوحة — يجلب كل المنتجات ويفلتر محلياً
export function usePosVariants(search: string, categoryId: string | null) {
  const [allVariants, setAllVariants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    db.product_variants()
      .select(`
        id, size_name, barcode, sku, cost_price, sale_price, min_stock, image_url, product_id,
        product:products!inner(id, name, is_tintable, category_id, main_image_url),
        inventory(quantity, warehouse_id)
      `)
      .eq('is_active', true)
      .eq('product.is_active', true)
      .order('sale_price')
      .limit(2000)
      .then(({ data, error }) => {
        if (!error && data) {
          setAllVariants(data)
        }
        setLoading(false)
      })
  }, [])

  const filteredData = useMemo(() => {
    let result = allVariants

    if (categoryId) {
      result = result.filter((v: any) => v.product?.category_id === categoryId)
    }

    if (search.length >= 1) {
      const term = search.toLowerCase().trim()
      result = result.filter((v: any) => {
        const name = (v.product?.name ?? '').toLowerCase()
        const size = (v.size_name ?? '').toLowerCase()
        const sku = (v.sku ?? '').toLowerCase()
        const barcode = v.barcode ?? ''
        return name.includes(term) ||
               size.includes(term) ||
               sku.includes(term) ||
               barcode === search
      })
    }

    return result.slice(0, 80)
  }, [allVariants, search, categoryId])

  return { data: filteredData, loading }
}

export function useColors(search: string) {
  const [data, setData] = useState<Color[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    let query = db.colors()
      .select('id, color_code, color_name, color_name_ar, hex_value, is_popular, collection_id')
      .eq('is_active', true)
      .order('color_code')
      .limit(200)

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
      .select('id, code, name, phone, mobile, customer_type, current_balance, total_purchases')
      .eq('is_active', true)
      .order('name')
      .limit(50)

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
