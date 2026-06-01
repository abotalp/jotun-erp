import { useState, useEffect } from 'react'
import { db } from '@/lib/supabase'
import type { Sale } from '@/types/database'

export function useSalesList(filters: {
  dateFrom?: string
  dateTo?: string
  status?: string
  search?: string
}) {
  const [data, setData] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    let query = db.sales()
      .select(`
        *,
        customer:customers(id, name, phone),
        items:sale_items(
          id, product_name, size_name, quantity, unit_price, total, cost_price, profit,
          color:sale_item_colors(color_code, color_name, formula_snapshot)
        ),
        payments:sale_payments(*)
      `)
      .order('created_at', { ascending: false })
      .limit(200)

    if (filters.dateFrom) query = query.gte('date', filters.dateFrom)
    if (filters.dateTo)   query = query.lte('date', filters.dateTo + 'T23:59:59')
    if (filters.status)   query = query.eq('status', filters.status)

    query.then(({ data, error }) => {
      if (!error && data) {
        let result = data as Sale[]
        if (filters.search) {
          const term = filters.search.toLowerCase()
          result = result.filter(s =>
            s.invoice_no.toLowerCase().includes(term) ||
            (s.customer as any)?.name?.toLowerCase().includes(term)
          )
        }
        setData(result)
      }
      setLoading(false)
    })
  }, [filters.dateFrom, filters.dateTo, filters.status, filters.search, refreshKey])

  return {
    data,
    loading,
    refresh: () => setRefreshKey(k => k + 1)
  }
}

export async function cancelSale(saleId: string) {
  try {
    // Get sale items first to restore inventory
    const { data: items } = await db.sale_items()
      .select('variant_id, quantity')
      .eq('sale_id', saleId)

    const { data: sale } = await db.sales()
      .select('warehouse_id, total, customer_id, payment_method')
      .eq('id', saleId)
      .single()

    // Restore inventory for each item
    if (items && sale?.warehouse_id) {
      for (const item of items) {
        if (!item.variant_id) continue
        const { data: inv } = await db.inventory()
          .select('quantity')
          .eq('variant_id', item.variant_id)
          .eq('warehouse_id', sale.warehouse_id)
          .single()
        if (inv) {
          await db.inventory()
            .update({
              quantity: (inv.quantity ?? 0) + item.quantity,
              last_updated: new Date().toISOString()
            })
            .eq('variant_id', item.variant_id)
            .eq('warehouse_id', sale.warehouse_id)
        }
      }
    }

    // Update sale status
    const { error } = await db.sales()
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', saleId)

    if (error) throw error
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}