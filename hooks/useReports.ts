import { useState, useEffect } from 'react'
import { db } from '@/lib/supabase'

export function useSalesReport(dateFrom: string, dateTo: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    db.sales()
      .select(`*, customer:customers(name), items:sale_items(quantity, total, profit, product_name)`)
      .eq('status', 'completed')
      .gte('date', dateFrom)
      .lte('date', dateTo + 'T23:59:59')
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setData(data)
        setLoading(false)
      })
  }, [dateFrom, dateTo])

  return { data, loading }
}

export function useTopProducts(dateFrom: string, dateTo: string) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    db.sale_items()
      .select('product_name, quantity, total, profit, sale:sales!inner(date, status)')
      .gte('sale.date', dateFrom)
      .lte('sale.date', dateTo + 'T23:59:59')
      .eq('sale.status', 'completed')
      .limit(500)
      .then(({ data, error }) => {
        if (!error && data) {
          const grouped: Record<string, any> = {}
          data.forEach((i: any) => {
            if (!grouped[i.product_name]) grouped[i.product_name] = { name: i.product_name, qty: 0, total: 0, profit: 0 }
            grouped[i.product_name].qty += i.quantity
            grouped[i.product_name].total += i.total
            grouped[i.product_name].profit += i.profit ?? 0
          })
          setData(Object.values(grouped).sort((a: any, b: any) => b.total - a.total).slice(0, 20))
        }
      })
  }, [dateFrom, dateTo])

  return data
}

export function useInventoryReport() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    db.inventory()
      .select(`*, variant:product_variants(size_name, sku, min_stock, sale_price, cost_price, product:products(name, category:categories(name))), warehouse:warehouses(name)`)
      .gt('quantity', 0)
      .order('quantity')
      .then(({ data }) => setData(data ?? []))
  }, [])

  return data
}

export function useColorsReport(dateFrom: string, dateTo: string) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    db.customer_color_history()
      .select('color_id, quantity_sold, color:colors(color_code, color_name, color_name_ar, hex_value)')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo + 'T23:59:59')
      .then(({ data, error }) => {
        if (!error && data) {
          const grouped: Record<string, any> = {}
          data.forEach((r: any) => {
            if (!r.color_id) return
            if (!grouped[r.color_id]) grouped[r.color_id] = { ...r.color, totalQty: 0, count: 0 }
            grouped[r.color_id].totalQty += r.quantity_sold ?? 0
            grouped[r.color_id].count += 1
          })
          setData(Object.values(grouped).sort((a: any, b: any) => b.count - a.count).slice(0, 15))
        }
      })
  }, [dateFrom, dateTo])

  return data
}

export function useCustomersReport() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    db.customers()
      .select('name, customer_type, total_purchases, current_balance, phone, city')
      .eq('is_active', true)
      .order('total_purchases', { ascending: false })
      .limit(50)
      .then(({ data }) => setData(data ?? []))
  }, [])

  return data
}