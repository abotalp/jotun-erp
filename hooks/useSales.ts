import { useState } from 'react'
import { db, rpc } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import type { CartItem } from '@/types/database'

export interface CompleteSalePayload {
  cart:                 CartItem[]
  customerId:           string | null
  contractorId:         string | null
  projectId:            string | null
  discountType:         'percentage' | 'fixed'
  discountValue:        number
  paymentMethod:        string
  paidAmount:           number
  isTaxInvoice:         boolean
  notes:                string
  contractorCommission: number
}

export function useCompleteSale() {
  const { settings, activeWarehouse, user } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function completeSale(payload: CompleteSalePayload) {
    setLoading(true)
    setError(null)

    try {
      // 1. حساب الإجماليات
      const itemsSubtotal = payload.cart.reduce((s, i) => s + i.subtotal, 0)
      const itemsTax      = payload.cart.reduce((s, i) => s + i.taxAmount, 0)

      let discountAmount = 0
      if (payload.discountType === 'percentage') {
        discountAmount = itemsSubtotal * (payload.discountValue / 100)
      } else {
        discountAmount = payload.discountValue
      }

      const afterDiscount = itemsSubtotal - discountAmount
      const taxRate       = payload.isTaxInvoice ? (settings?.default_tax_rate ?? 14) : 0
      const invoiceTax    = afterDiscount * (taxRate / 100)
      const total         = afterDiscount + itemsTax + invoiceTax
      const remaining     = Math.max(0, total - payload.paidAmount)

      // 2. توليد رقم الفاتورة
      const { data: invNo, error: invErr } = await rpc.nextInvoiceNumber(
        settings?.invoice_prefix ?? 'INV'
      )
      if (invErr) throw invErr

      // 3. إنشاء الفاتورة
      const { data: sale, error: saleErr } = await db.sales()
        .insert({
          invoice_no:            invNo as string,
          invoice_type:          payload.isTaxInvoice ? 'tax' : 'simple',
          sale_type:             remaining > 0 ? 'credit' : 'cash',
          warehouse_id:          activeWarehouse?.id ?? null,
          customer_id:           payload.customerId || null,
          contractor_id:         payload.contractorId || null,
          project_id:            payload.projectId || null,
          subtotal:              itemsSubtotal,
          discount_type:         payload.discountType,
          discount_value:        payload.discountValue,
          discount_amount:       discountAmount,
          tax_rate:              taxRate,
          tax_amount:            itemsTax + invoiceTax,
          total,
          paid:                  payload.paidAmount,
          remaining,
          payment_method:        payload.paymentMethod,
          status:                'completed',
          is_tax_invoice:        payload.isTaxInvoice,
          contractor_commission: payload.contractorCommission,
          notes:                 payload.notes || null,
          cashier_id:            user?.id ?? null
        })
        .select()
        .single()

      if (saleErr) throw saleErr

      // 4. إضافة البنود
      const itemRows = payload.cart.map((item, idx) => ({
        sale_id:         sale.id,
        variant_id:      item.variantId || null,
        product_name:    item.productName,
        size_name:       item.sizeName || null,
        barcode:         item.barcode || null,
        quantity:        item.quantity,
        unit_price:      item.unitPrice,
        original_price:  item.originalPrice,
        discount_pct:    item.discountPct,
        discount_amount: item.discountAmount,
        tax_rate:        item.taxRate,
        tax_amount:      item.taxAmount,
        subtotal:        item.subtotal,
        total:           item.total,
        cost_price:      item.costPrice,
        profit:          item.subtotal - item.costPrice * item.quantity,
        notes:           item.notes || null,
        sort_order:      idx
      }))

      const { data: insertedItems, error: itemsErr } = await db.sale_items()
        .insert(itemRows)
        .select('id')

      if (itemsErr) throw itemsErr

      // 5. ربط الألوان
      const colorRows = payload.cart
        .map((item, idx) => item.color ? {
          sale_item_id: insertedItems[idx].id,
          color_id:     item.color.colorId || null,
          color_code:   item.color.colorCode,
          color_name:   item.color.colorName,
          tinting_fee:  0
        } : null)
        .filter(Boolean) as any[]

      if (colorRows.length > 0) {
        await db.sale_item_colors().insert(colorRows)
      }

      // 6. تسجيل الدفعة
      if (payload.paidAmount > 0) {
        await db.sale_payments().insert({
          sale_id:        sale.id,
          amount:         payload.paidAmount,
          payment_method: payload.paymentMethod as any,
          received_by:    user?.id ?? null
        })
      }

      // 7. خصم المخزون
      await rpc.deductInventoryForSale(sale.id)

      // 8. تحديث رصيد العميل (إذا آجل)
      if (payload.customerId && remaining > 0) {
        await rpc.updateCustomerBalance(
          payload.customerId, remaining, 'sale', sale.id, invNo as string
        )
      }

      // 9. حفظ سجل الألوان للعميل
      if (payload.customerId && colorRows.length > 0) {
        const histRows = payload.cart
          .filter(i => i.color)
          .map(i => ({
            customer_id:      payload.customerId!,
            color_id:         i.color!.colorId || null,
            variant_id:       i.variantId || null,
            project_id:       payload.projectId || null,
            sale_id:          sale.id,
            quantity_sold:    i.quantity,
            room_description: i.notes || null,
            sold_by:          user?.id ?? null
          }))
        await db.customer_color_history().insert(histRows)
      }

      // 10. خزينة
      if (payload.paidAmount > 0 && payload.paymentMethod === 'cash') {
        const { data: reg } = await db.cash_registers()
          .select('id, current_balance')
          .eq('is_active', true)
          .single()
        if (reg) {
          const newBal = (reg.current_balance ?? 0) + payload.paidAmount
          await db.cash_registers()
            .update({ current_balance: newBal })
            .eq('id', reg.id)
          await db.cash_movements().insert({
            register_id:   reg.id,
            movement_type: 'in',
            source:        'sale',
            reference_id:  sale.id,
            reference_no:  invNo as string,
            amount:        payload.paidAmount,
            balance_after: newBal,
            description:   `فاتورة بيع ${invNo}`,
            user_id:       user?.id ?? null
          })
        }
      }

      setLoading(false)
      return { success: true, sale, invoiceNo: invNo as string }

    } catch (e: any) {
      console.error('Sale error:', e)
      setError(e.message)
      setLoading(false)
      return { success: false, error: e.message }
    }
  }

  return { completeSale, loading, error }
}