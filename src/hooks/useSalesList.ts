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

  return { data, loading, refresh: () => setRefreshKey(k => k + 1) }
}

export async function cancelSale(saleId: string, userId?: string) {
  try {
    // 1. جلب بيانات الفاتورة
    const { data: sale } = await db.sales()
      .select('warehouse_id, total, paid, customer_id, payment_method, invoice_no, status')
      .eq('id', saleId)
      .single()

    if (!sale) throw new Error('الفاتورة غير موجودة')
    if (sale.status === 'cancelled') throw new Error('الفاتورة ملغاة بالفعل')

    // 2. جلب البنود
    const { data: items } = await db.sale_items()
      .select('variant_id, quantity')
      .eq('sale_id', saleId)

    // 3. إرجاع المخزون
    if (items && sale.warehouse_id) {
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

          await db.inventory_movements().insert({
            variant_id: item.variant_id,
            warehouse_id: sale.warehouse_id,
            movement_type: 'sale_return',
            reference_type: 'sale_cancel',
            reference_id: saleId,
            quantity: item.quantity,
            qty_before: inv.quantity ?? 0,
            qty_after: (inv.quantity ?? 0) + item.quantity,
            notes: `إلغاء فاتورة ${sale.invoice_no}`,
            user_id: userId
          })
        }
      }
    }

    // 4. خصم المبلغ المدفوع من الخزينة
    if (sale.paid > 0 && sale.payment_method === 'cash') {
      const { data: reg } = await db.cash_registers()
        .select('id, current_balance')
        .eq('is_active', true)
        .single()
      if (reg) {
        const newBal = (reg.current_balance ?? 0) - sale.paid
        await db.cash_registers()
          .update({ current_balance: newBal })
          .eq('id', reg.id)
        await db.cash_movements().insert({
          register_id: reg.id,
          movement_type: 'out',
          source: 'sale_return',
          reference_id: saleId,
          reference_no: sale.invoice_no,
          amount: sale.paid,
          balance_after: newBal,
          description: `إلغاء فاتورة ${sale.invoice_no}`,
          user_id: userId
        })
      }
    }

    // 5. تعديل رصيد العميل
    if (sale.customer_id) {
      const remaining = sale.total - sale.paid
      const { data: cust } = await db.customers()
        .select('current_balance, total_purchases')
        .eq('id', sale.customer_id).single()
      if (cust) {
        await db.customers().update({
          current_balance: (cust.current_balance ?? 0) - remaining,
          total_purchases: (cust.total_purchases ?? 0) - sale.total
        }).eq('id', sale.customer_id)

        // تسجيل حركة عكسية
        await db.customer_transactions().insert({
          customer_id: sale.customer_id,
          type: 'adjustment',
          reference_id: saleId,
          reference_no: sale.invoice_no,
          amount: -sale.total,
          notes: `إلغاء فاتورة ${sale.invoice_no}`
        })
      }
    }

    // 6. تحديث حالة الفاتورة
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

export async function returnSaleItems(
  saleId: string,
  itemsToReturn: Array<{ saleItemId: string; variantId: string | null; quantity: number; unitPrice: number }>,
  userId?: string
) {
  try {
    const { data: sale } = await db.sales()
      .select('warehouse_id, paid, total, customer_id, payment_method, invoice_no')
      .eq('id', saleId)
      .single()

    if (!sale) throw new Error('الفاتورة غير موجودة')

    const totalRefund = itemsToReturn.reduce((s, i) => s + (i.quantity * i.unitPrice), 0)

    // 1. إنشاء سجل المرتجع
    const returnNo = `RET-${Date.now()}`
    const { data: returnRec, error: retErr } = await db.sale_returns().insert({
      return_no: returnNo,
      sale_id: saleId,
      total_amount: totalRefund,
      refund_method: 'cash',
      status: 'completed',
      created_by: userId
    }).select().single()

    if (retErr) throw retErr

    // 2. حفظ بنود المرتجع
    const returnItemRows = itemsToReturn.map(i => ({
      return_id: returnRec.id,
      sale_item_id: i.saleItemId,
      quantity_returned: i.quantity,
      unit_price: i.unitPrice,
      total_refund: i.quantity * i.unitPrice
    }))
    await db.sale_return_items().insert(returnItemRows)

    // 3. إرجاع المخزون
    if (sale.warehouse_id) {
      for (const item of itemsToReturn) {
        if (!item.variantId) continue
        const { data: inv } = await db.inventory()
          .select('quantity')
          .eq('variant_id', item.variantId)
          .eq('warehouse_id', sale.warehouse_id)
          .single()
        if (inv) {
          await db.inventory().update({
            quantity: (inv.quantity ?? 0) + item.quantity,
            last_updated: new Date().toISOString()
          })
            .eq('variant_id', item.variantId)
            .eq('warehouse_id', sale.warehouse_id)

          await db.inventory_movements().insert({
            variant_id: item.variantId,
            warehouse_id: sale.warehouse_id,
            movement_type: 'sale_return',
            reference_type: 'return',
            reference_id: returnRec.id,
            quantity: item.quantity,
            qty_before: inv.quantity ?? 0,
            qty_after: (inv.quantity ?? 0) + item.quantity,
            notes: `مرتجع ${returnNo}`,
            user_id: userId
          })
        }
      }
    }

    // 4. خصم من الخزينة
    if (sale.payment_method === 'cash') {
      const { data: reg } = await db.cash_registers()
        .select('id, current_balance')
        .eq('is_active', true)
        .single()
      if (reg) {
        const newBal = (reg.current_balance ?? 0) - totalRefund
        await db.cash_registers().update({ current_balance: newBal }).eq('id', reg.id)
        await db.cash_movements().insert({
          register_id: reg.id,
          movement_type: 'out',
          source: 'sale_return',
          reference_id: returnRec.id,
          reference_no: returnNo,
          amount: totalRefund,
          balance_after: newBal,
          description: `مرتجع ${returnNo} - فاتورة ${sale.invoice_no}`,
          user_id: userId
        })
      }
    }

    // 5. تعديل رصيد العميل
    if (sale.customer_id) {
      const { data: cust } = await db.customers()
        .select('current_balance, total_purchases')
        .eq('id', sale.customer_id).single()
      if (cust) {
        await db.customers().update({
          current_balance: (cust.current_balance ?? 0) - totalRefund,
          total_purchases: Math.max(0, (cust.total_purchases ?? 0) - totalRefund)
        }).eq('id', sale.customer_id)

        await db.customer_transactions().insert({
          customer_id: sale.customer_id,
          type: 'return',
          reference_id: returnRec.id,
          reference_no: returnNo,
          amount: -totalRefund,
          notes: `مرتجع ${returnNo}`
        })
      }
    }

    return { success: true, returnNo }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
