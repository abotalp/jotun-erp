import { useEffect, useState, useRef } from 'react'
import { db } from '@/lib/supabase'
import type { Category, ProductVariant, Color, Customer } from '@/types/database'

// Cache للتصنيفات (لا تتغير كثيراً)
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

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

export function usePosVariants(search: string, categoryId: string | null) {
  const [data, setData] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(false)
  const requestIdRef = useRef(0)

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    const myRequestId = ++requestIdRef.current
    setLoading(true)

    let query = db.product_variants()
      .select(`
        id, size_name, barcode, sku, cost_price, sale_price, min_stock, image_url, product_id,
        product:products!inner(id, name, is_tintable, category_id),
        inventory(quantity, warehouse_id)
      `)
      .eq('is_active', true)
      .eq('product.is_active', true)
      .order('sale_price')
      .limit(60)

    if (debouncedSearch.length >= 2) {
      query = query.or(`barcode.eq.${debouncedSearch},sku.ilike.%${debouncedSearch}%`)
    }
    if (categoryId) {
      query = query.eq('product.category_id', categoryId)
    }

    query.then(({ data: result, error }) => {
      // إذا تم استدعاء أحدث، تجاهل النتيجة القديمة
      if (myRequestId !== requestIdRef.current) return

      if (!error && result) {
        let filtered = result as any[]
        if (debouncedSearch.length >= 2) {
          const term = debouncedSearch.toLowerCase()
          filtered = filtered.filter((v: any) =>
            v.product?.name?.toLowerCase().includes(term) ||
            v.barcode === debouncedSearch ||
            v.sku?.toLowerCase().includes(term)
          )
        }
        setData(filtered as ProductVariant[])
      }
      setLoading(false)
    })
  }, [debouncedSearch, categoryId])

  return { data, loading }
}

export function useColors(search: string) {
  const [data, setData] = useState<Color[]>([])
  const [loading, setLoading] = useState(true)
  const requestIdRef = useRef(0)

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    const myRequestId = ++requestIdRef.current
    setLoading(true)

    let query = db.colors()
      .select('id, color_code, color_name, color_name_ar, hex_value, is_popular, collection_id')
      .eq('is_active', true)
      .order('color_code')
      .limit(60)

    if (debouncedSearch.length >= 1) {
      query = query.or(
        `color_code.ilike.%${debouncedSearch}%,color_name.ilike.%${debouncedSearch}%,color_name_ar.ilike.%${debouncedSearch}%`
      )
    }

    query.then(({ data, error }) => {
      if (myRequestId !== requestIdRef.current) return
      if (!error && data) setData(data as Color[])
      setLoading(false)
    })
  }, [debouncedSearch])

  return { data, loading }
}

export function useCustomers(search: string) {
  const [data, setData] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const requestIdRef = useRef(0)

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    const myRequestId = ++requestIdRef.current
    setLoading(true)

    let query = db.customers()
      .select('id, code, name, phone, mobile, customer_type, current_balance, total_purchases')
      .eq('is_active', true)
      .order('name')
      .limit(30)

    if (debouncedSearch.length >= 1) {
      query = query.or(`name.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%,code.ilike.%${debouncedSearch}%`)
    }

    query.then(({ data, error }) => {
      if (myRequestId !== requestIdRef.current) return
      if (!error && data) setData(data as Customer[])
      setLoading(false)
    })
  }, [debouncedSearch])

  return { data, loading }
}
