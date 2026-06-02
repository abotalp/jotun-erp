import { useState, useEffect } from 'react'
import { db, rpc } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'

export function usePurchasesList() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    db.purchases()
      .select(`
        *,
        supplier:suppliers(id, name, phone),
        items:purchase_items(*, variant:product_variants(size_name, product:products(name)))
      `)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!error && data) setData(data)
        setLoading(false)
      })
  }, [refreshKey])

  return { data, loading, refresh: () => setRefreshKey(k => k + 1) }
}

export function useSearchVariants(search: string) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    if (search.length < 2) { setData([]); return }
    db.product_variants()
      .select('*, product:products(name)')
      .or(`barcode.eq.${search},sku.ilike.%${search}%`)
      .eq('is_active', true)
      .limit(10)
      .then(({ data: byBarcode }) => {
        if (byBarcode && byBarcode.length > 0) { setData(byBarcode); return }
        db.product_variants()
          .select('*, product:products!inner(name)')
          .ilike('product.name', `%${search}%`)
          .eq('is_active', true)
          .limit(10)
          .then(({ data: byName }) => setData(byName ?? []))
      })
  }, [search])

  return data
}

export function useActiveSuppliers() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    db.suppliers().select('*').eq('is_active', true).order('name')
      .then(({ data }) => setData(data ?? []))
  }, [])

  return data
}

export async function createPurchase(payload: any) {
  try {
    const { data: poNo } = await rpc.nextPoNumber('PO')
    const { data: purchase, error: pErr } = await db.purchases()
      .insert({
        po_no: poNo as string,
        supplier_id: payload.supplierId,
        supplier_invoice_no: payload.supplierInvoiceNo || null,
        warehouse_id: payload.warehouseId,
        date: payload.date,
        subtotal: payload.subtotal,
        total: payload.total,
        paid: payload.paid,
        remaining: payload.remaining,
        payment_method: payload.paymentMethod,
        status: 'received',
        notes: payload.notes || null,
        created_by: payload.userId
      })
      .select().single()
    if (pErr) throw pErr

    const itemRows = payload.items.map((i: any) => ({
      purchase_id: purchase.id,
      variant_id: i.variantId,
      product_name: i.productName,
      size_name: i.sizeName,
      quantity: i.quantity,
      unit_cost: i.unitCost,
      discount_pct: i.discountPct,
      total: i.total
    }))
    const { error: iErr } = await db.purchase_items().insert(itemRows)
    if (iErr) throw iErr

    await rpc.updateInventoryFromPurchase(purchase.id)

    // Update supplier
    const { data: sup } = await db.suppliers()
      .select('current_balance, total_purchases')
      .eq('id', payload.supplierId).single()
    if (sup) {
      await db.suppliers().update({
        current_balance: (sup.current_balance ?? 0) + payload.remaining,
        total_purchases: (sup.total_purchases ?? 0) + payload.total
      }).eq('id', payload.supplierId)

      await db.supplier_transactions().insert({
        supplier_id: payload.supplierId,
        type: 'purchase',
        reference_id: purchase.id,
        reference_no: poNo as string,
        amount: payload.remaining,
        balance_after: (sup.current_balance ?? 0) + payload.remaining
      })
    }

    return { success: true, poNo: poNo as string }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}