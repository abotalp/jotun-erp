import { useState, useEffect } from 'react'
import { db, rpc } from '@/lib/supabase'

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
    if (search.length < 2) {
      setData([])
      return
    }

    db.product_variants()
      .select(`
        id, size_name, sku, barcode, cost_price, sale_price,
        product:products!inner(id, name, is_active)
      `)
      .eq('is_active', true)
      .eq('product.is_active', true)
      .limit(50)
      .then(({ data: variants, error }) => {
        if (error || !variants) {
          setData([])
          return
        }

        const term = search.toLowerCase()
        const filtered = variants.filter((v: any) =>
          v.product?.name?.toLowerCase().includes(term) ||
          v.sku?.toLowerCase().includes(term) ||
          v.barcode === search ||
          v.size_name?.toLowerCase().includes(term)
        )

        setData(filtered.slice(0, 20))
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

export async function createPurchase(payload: {
  supplierId: string
  warehouseId: string
  supplierInvoiceNo: string
  date: string
  items: Array<{
    variantId: string
    productName: string
    sizeName: string
    quantity: number
    unitCost: number
    discountPct: number
    total: number
  }>
  subtotal: number
  total: number
  paid: number
  remaining: number
  paymentMethod: string
  notes: string
  userId?: string
}) {
  try {
    // 1. توليد رقم الفاتورة
    const { data: poNo, error: noErr } = await rpc.nextPoNumber('PO')
    if (noErr) throw noErr

    // 2. حفظ الفاتورة
    const { data: purchase, error: pErr } = await db.purchases().insert({
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
    }).select().single()

    if (pErr) throw pErr

    // 3. حفظ البنود
    const itemRows = payload.items.map((i) => ({
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

    // 4. تحديث المخزون يدوياً
    for (const item of payload.items) {
      const { data: inv } = await db.inventory()
        .select('id, quantity, avg_cost')
        .eq('variant_id', item.variantId)
        .eq('warehouse_id', payload.warehouseId)
        .maybeSingle()

      if (inv) {
        // حساب متوسط التكلفة الجديد
        const oldQty = inv.quantity ?? 0
        const oldAvg = inv.avg_cost ?? 0
        const newQty = oldQty + item.quantity
        const newAvg = newQty > 0
          ? ((oldQty * oldAvg) + (item.quantity * item.unitCost)) / newQty
          : item.unitCost

        await db.inventory()
          .update({
            quantity: newQty,
            avg_cost: newAvg,
            last_purchase_price: item.unitCost,
            last_updated: new Date().toISOString()
          })
          .eq('id', inv.id)

        // تسجيل حركة المخزون
        await db.inventory_movements().insert({
          variant_id: item.variantId,
          warehouse_id: payload.warehouseId,
          movement_type: 'purchase',
          reference_type: 'purchase',
          reference_id: purchase.id,
          quantity: item.quantity,
          unit_cost: item.unitCost,
          qty_before: oldQty,
          qty_after: newQty,
          notes: `فاتورة شراء ${poNo}`,
          user_id: payload.userId
        })
      } else {
        // إنشاء سجل مخزون جديد
        await db.inventory().insert({
          variant_id: item.variantId,
          warehouse_id: payload.warehouseId,
          quantity: item.quantity,
          avg_cost: item.unitCost,
          last_purchase_price: item.unitCost
        })

        await db.inventory_movements().insert({
          variant_id: item.variantId,
          warehouse_id: payload.warehouseId,
          movement_type: 'purchase',
          reference_type: 'purchase',
          reference_id: purchase.id,
          quantity: item.quantity,
          unit_cost: item.unitCost,
          qty_before: 0,
          qty_after: item.quantity,
          notes: `فاتورة شراء ${poNo}`,
          user_id: payload.userId
        })
      }
    }

    // 5. تحديث رصيد المورد
    const { data: sup } = await db.suppliers()
      .select('current_balance, total_purchases')
      .eq('id', payload.supplierId).single()

    if (sup) {
      await db.suppliers().update({
        current_balance: (sup.current_balance ?? 0) + payload.remaining,
        total_purchases: (sup.total_purchases ?? 0) + payload.total
      }).eq('id', payload.supplierId)

      // تسجيل في حساب المورد
      await db.supplier_transactions().insert({
        supplier_id: payload.supplierId,
        type: 'purchase',
        reference_id: purchase.id,
        reference_no: poNo as string,
        amount: payload.remaining,
        balance_after: (sup.current_balance ?? 0) + payload.remaining,
        notes: `فاتورة شراء ${poNo}`
      })
    }

    // 6. خصم من الخزينة (لو نقدي)
    if (payload.paid > 0 && payload.paymentMethod === 'cash') {
      const { data: reg } = await db.cash_registers()
        .select('id, current_balance')
        .eq('is_active', true)
        .single()

      if (reg) {
        const newBal = (reg.current_balance ?? 0) - payload.paid
        await db.cash_registers().update({ current_balance: newBal }).eq('id', reg.id)

        await db.cash_movements().insert({
          register_id: reg.id,
          movement_type: 'out',
          source: 'purchase',
          reference_id: purchase.id,
          reference_no: poNo as string,
          amount: payload.paid,
          balance_after: newBal,
          description: `فاتورة شراء ${poNo}`,
          user_id: payload.userId
        })
      }
    }

    return { success: true, poNo: poNo as string }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
