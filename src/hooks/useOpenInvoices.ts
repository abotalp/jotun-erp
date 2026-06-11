import { useState, useEffect } from 'react'
import { db, rpc, supabase } from '@/lib/supabase'

export function useOpenInvoices(customerId?: string | null) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    let q = db.sales()
      .select(`
        id, invoice_no, date, total, paid, remaining, status, customer_id,
        customer:customers(id, name, phone, customer_type),
        items:sale_items(id, product_name, size_name, quantity, unit_price, total)
      `)
      .eq('status', 'open')
      .order('date', { ascending: false })
      .limit(200)

    if (customerId) q = q.eq('customer_id', customerId)

    q.then(({ data, error }) => {
      if (!error && data) setData(data)
      setLoading(false)
    })
  }, [customerId, refreshKey])

  return { data, loading, refresh: () => setRefreshKey(k => k + 1) }
}

export async function getOpenInvoice(saleId: string) {
  try {
    const { data, error } = await db.sales()
      .select(`
        *,
        customer:customers(id, name, phone, customer_type),
        items:sale_items(
          id, variant_id, product_name, size_name, quantity, unit_price, total, cost_price,
          color:sale_item_colors(color_code, color_name, color_id)
        ),
        payments:sale_payments(*)
      `)
      .eq('id', saleId)
      .single()

    if (error) throw error
    return { success: true, invoice: data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function addItemToOpenInvoice(
  saleId: string,
  item: {
    variantId: string
    productName: string
    sizeName: string
    quantity: number
    unitPrice: number
    costPrice: number
    color?: { colorId: string; colorCode: string; colorName: string }
  },
  warehouseId: string,
  userId?: string
) {
  try {
    const subtotal = item.quantity * item.unitPrice
    const profit = subtotal - (item.costPrice * item.quantity)

    const { data: newItem, error: itemErr } = await db.sale_items().insert({
      sale_id: saleId,
      variant_id: item.variantId,
      product_name: item.productName,
      size_name: item.sizeName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      original_price: item.unitPrice,
      subtotal,
      total: subtotal,
      cost_price: item.costPrice,
      profit
    }).select().single()

    if (itemErr) throw itemErr

    if (item.color && newItem) {
      await db.sale_item_colors().insert({
        sale_item_id: newItem.id,
        color_id: item.color.colorId,
        color_code: item.color.colorCode,
        color_name: item.color.colorName,
        tinting_fee: 0
      })
    }

    const { data: inv } = await db.inventory()
      .select('id, quantity')
      .eq('variant_id', item.variantId)
      .eq('warehouse_id', warehouseId)
      .single()

    if (inv) {
      const newQty = Math.max(0, (inv.quantity ?? 0) - item.quantity)
      await db.inventory().update({ quantity: newQty, last_updated: new Date().toISOString() }).eq('id', inv.id)
      await db.inventory_movements().insert({
        variant_id: item.variantId, warehouse_id: warehouseId,
        movement_type: 'sale', reference_type: 'open_invoice_add', reference_id: saleId,
        quantity: -item.quantity, unit_cost: item.costPrice,
        qty_before: inv.quantity ?? 0, qty_after: newQty,
        notes: 'إضافة لفاتورة مفتوحة', user_id: userId
      })
    }

    await recalculateOpenInvoice(saleId)
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function removeItemFromOpenInvoice(itemId: string, warehouseId: string, userId?: string) {
  try {
    const { data: item } = await db.sale_items()
      .select('sale_id, variant_id, quantity, cost_price')
      .eq('id', itemId).single()

    if (!item) throw new Error('البند غير موجود')

    if (item.variant_id) {
      const { data: inv } = await db.inventory()
        .select('id, quantity')
        .eq('variant_id', item.variant_id)
        .eq('warehouse_id', warehouseId)
        .single()

      if (inv) {
        const newQty = (inv.quantity ?? 0) + item.quantity
        await db.inventory().update({ quantity: newQty, last_updated: new Date().toISOString() }).eq('id', inv.id)
        await db.inventory_movements().insert({
          variant_id: item.variant_id, warehouse_id: warehouseId,
          movement_type: 'sale_return', reference_type: 'open_invoice_remove', reference_id: itemId,
          quantity: item.quantity, qty_before: inv.quantity ?? 0, qty_after: newQty,
          notes: 'حذف من فاتورة مفتوحة', user_id: userId
        })
      }
    }

    await db.sale_item_colors().delete().eq('sale_item_id', itemId)
    await db.sale_items().delete().eq('id', itemId)
    await recalculateOpenInvoice(item.sale_id)
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updateInvoiceItem(
  itemId: string,
  updates: { quantity?: number; unit_price?: number }
) {
  try {
    const { data: item } = await db.sale_items()
      .select('quantity, unit_price, sale_id, cost_price')
      .eq('id', itemId).single()

    if (!item) throw new Error('البند غير موجود')

    const newQty = updates.quantity ?? item.quantity
    const newPrice = updates.unit_price ?? item.unit_price
    const newTotal = newQty * newPrice

    await db.sale_items().update({
      quantity: newQty,
      unit_price: newPrice,
      original_price: newPrice,
      subtotal: newTotal,
      total: newTotal,
      profit: newTotal - (item.cost_price ?? 0) * newQty
    }).eq('id', itemId)

    const { data: allItems } = await db.sale_items()
      .select('total').eq('sale_id', item.sale_id)
    const subtotal = (allItems ?? []).reduce((s: number, i: any) => s + (i.total ?? 0), 0)

    const { data: payments } = await db.sale_payments()
      .select('amount').eq('sale_id', item.sale_id)
    const paid = (payments ?? []).reduce((s: number, p: any) => s + p.amount, 0)

    await db.sales().update({
      subtotal, total: subtotal, paid,
      remaining: Math.max(0, subtotal - paid),
      updated_at: new Date().toISOString()
    }).eq('id', item.sale_id)

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

async function recalculateOpenInvoice(saleId: string) {
  const { data: items } = await db.sale_items().select('total').eq('sale_id', saleId)
  const subtotal = (items ?? []).reduce((s: number, i: any) => s + (i.total ?? 0), 0)
  const { data: payments } = await db.sale_payments().select('amount').eq('sale_id', saleId)
  const paid = (payments ?? []).reduce((s: number, p: any) => s + p.amount, 0)
  await db.sales().update({ subtotal, total: subtotal, paid, remaining: Math.max(0, subtotal - paid), updated_at: new Date().toISOString() }).eq('id', saleId)
}

export async function addPaymentToInvoice(saleId: string, amount: number, paymentMethod: string, notes: string, userId?: string) {
  try {
    if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر')
    const { data: payment, error: payErr } = await db.sale_payments().insert({ sale_id: saleId, amount, payment_method: paymentMethod as any, notes: notes || null, received_by: userId }).select().single()
    if (payErr) throw payErr
    await recalculateOpenInvoice(saleId)

    const { data: sale } = await db.sales().select('invoice_no, customer_id').eq('id', saleId).single()
    if (paymentMethod === 'cash' && sale) {
      const { data: reg } = await db.cash_registers().select('id, current_balance').eq('is_active', true).single()
      if (reg) {
        const newBal = (reg.current_balance ?? 0) + amount
        await db.cash_registers().update({ current_balance: newBal }).eq('id', reg.id)
        await db.cash_movements().insert({ register_id: reg.id, movement_type: 'in', source: 'sale', reference_id: saleId, reference_no: sale.invoice_no, amount, balance_after: newBal, description: `دفعة فاتورة ${sale.invoice_no}`, user_id: userId })
      }
    }
    if (sale?.customer_id) {
      const { data: cust } = await db.customers().select('current_balance').eq('id', sale.customer_id).single()
      if (cust) await db.customers().update({ current_balance: Math.max(0, (cust.current_balance ?? 0) - amount) }).eq('id', sale.customer_id)
    }
    return { success: true, paymentId: payment.id }
  } catch (e: any) { return { success: false, error: e.message } }
}

export async function updatePayment(paymentId: string, newAmount: number, newMethod: string, newNotes: string, userId?: string) {
  try {
    if (newAmount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر')
    const { data: oldPay } = await db.sale_payments().select('amount, sale_id, payment_method').eq('id', paymentId).single()
    if (!oldPay) throw new Error('الدفعة غير موجودة')
    const diff = newAmount - oldPay.amount
    await db.sale_payments().update({ amount: newAmount, payment_method: newMethod as any, notes: newNotes || null }).eq('id', paymentId)

    const { data: allItems } = await db.sale_items().select('total').eq('sale_id', oldPay.sale_id)
    const subtotal = (allItems ?? []).reduce((s: number, i: any) => s + (i.total ?? 0), 0)
    const { data: allPays } = await db.sale_payments().select('amount').eq('sale_id', oldPay.sale_id)
    const totalPaid = (allPays ?? []).reduce((s: number, p: any) => s + p.amount, 0)
    await db.sales().update({ paid: totalPaid, remaining: Math.max(0, subtotal - totalPaid), updated_at: new Date().toISOString() }).eq('id', oldPay.sale_id)

    if (oldPay.payment_method === 'cash' || newMethod === 'cash') {
      const { data: reg } = await db.cash_registers().select('id, current_balance').eq('is_active', true).single()
      if (reg) {
        let cashChange = 0
        if (oldPay.payment_method === 'cash' && newMethod === 'cash') cashChange = diff
        else if (oldPay.payment_method === 'cash' && newMethod !== 'cash') cashChange = -oldPay.amount
        else if (oldPay.payment_method !== 'cash' && newMethod === 'cash') cashChange = newAmount
        if (cashChange !== 0) {
          const newBal = (reg.current_balance ?? 0) + cashChange
          await db.cash_registers().update({ current_balance: newBal }).eq('id', reg.id)
          await db.cash_movements().insert({ register_id: reg.id, movement_type: cashChange > 0 ? 'in' : 'out', source: 'adjustment', reference_id: paymentId, amount: Math.abs(cashChange), balance_after: newBal, description: 'تعديل دفعة', user_id: userId })
        }
      }
    }
    const { data: sale } = await db.sales().select('customer_id').eq('id', oldPay.sale_id).single()
    if (sale?.customer_id) {
      const { data: cust } = await db.customers().select('current_balance').eq('id', sale.customer_id).single()
      if (cust) await db.customers().update({ current_balance: Math.max(0, (cust.current_balance ?? 0) - diff) }).eq('id', sale.customer_id)
    }
    return { success: true }
  } catch (e: any) { return { success: false, error: e.message } }
}

export async function deletePayment(paymentId: string, userId?: string) {
  try {
    const { data: pay } = await db.sale_payments().select('amount, sale_id, payment_method').eq('id', paymentId).single()
    if (!pay) throw new Error('الدفعة غير موجودة')
    const { data: sale } = await db.sales().select('customer_id, invoice_no').eq('id', pay.sale_id).single()
    await db.sale_payments().delete().eq('id', paymentId)

    const { data: items } = await db.sale_items().select('total').eq('sale_id', pay.sale_id)
    const subtotal = (items ?? []).reduce((s: number, i: any) => s + (i.total ?? 0), 0)
    const { data: allPays } = await db.sale_payments().select('amount').eq('sale_id', pay.sale_id)
    const totalPaid = (allPays ?? []).reduce((s: number, p: any) => s + p.amount, 0)
    await db.sales().update({ paid: totalPaid, remaining: Math.max(0, subtotal - totalPaid), updated_at: new Date().toISOString() }).eq('id', pay.sale_id)

    if (pay.payment_method === 'cash') {
      const { data: reg } = await db.cash_registers().select('id, current_balance').eq('is_active', true).single()
      if (reg) {
        const newBal = (reg.current_balance ?? 0) - pay.amount
        await db.cash_registers().update({ current_balance: newBal }).eq('id', reg.id)
        await db.cash_movements().insert({ register_id: reg.id, movement_type: 'out', source: 'adjustment', reference_id: paymentId, amount: pay.amount, balance_after: newBal, description: `حذف دفعة ${sale?.invoice_no ?? ''}`, user_id: userId })
      }
    }
    if (sale?.customer_id) {
      const { data: cust } = await db.customers().select('current_balance').eq('id', sale.customer_id).single()
      if (cust) await db.customers().update({ current_balance: (cust.current_balance ?? 0) + pay.amount }).eq('id', sale.customer_id)
    }
    return { success: true }
  } catch (e: any) { return { success: false, error: e.message } }
}

export async function closeOpenInvoice(saleId: string) {
  try {
    const { count } = await db.sale_items().select('id', { count: 'exact', head: true }).eq('sale_id', saleId)
    if (!count || count === 0) throw new Error('لا يمكن إغلاق فاتورة فارغة')
    await db.sales().update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', saleId)
    return { success: true }
  } catch (e: any) { return { success: false, error: e.message } }
}

export async function createOpenInvoice(customerId: string, warehouseId: string, userId?: string) {
  try {
    const { data: invNo } = await rpc.nextInvoiceNumber('INV')
    const { data: sale, error } = await db.sales().insert({
      invoice_no: invNo as string, invoice_type: 'simple', sale_type: 'credit',
      warehouse_id: warehouseId, customer_id: customerId,
      subtotal: 0, total: 0, paid: 0, remaining: 0,
      payment_method: 'cash', status: 'open', cashier_id: userId
    }).select().single()
    if (error) throw error
    return { success: true, sale }
  } catch (e: any) { return { success: false, error: e.message } }
}

export function useCustomerStandalonePayments(customerId: string | null) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!customerId) { setData([]); return }
    setLoading(true)
    supabase.from('customer_payments').select('*').eq('customer_id', customerId)
      .order('date', { ascending: false }).limit(100)
      .then(({ data, error }: any) => { if (!error && data) setData(data); setLoading(false) })
  }, [customerId, refreshKey])

  return { data, loading, refresh: () => setRefreshKey(k => k + 1) }
}

export async function createStandalonePayment(payload: {
  customerId: string; amount: number; direction: 'in' | 'out';
  paymentMethod: string; notes: string; userId?: string
}) {
  try {
    if (payload.amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر')
    const { data: payNo } = await supabase.rpc('next_payment_number', { direction: payload.direction })
    const { data: pay, error: payErr } = await supabase.from('customer_payments').insert({
      customer_id: payload.customerId, payment_no: payNo as string, amount: payload.amount,
      direction: payload.direction, payment_method: payload.paymentMethod,
      notes: payload.notes || null, created_by: payload.userId
    }).select().single()
    if (payErr) throw payErr

    const { data: cust } = await db.customers().select('current_balance').eq('id', payload.customerId).single()
    if (cust) {
      const change = payload.direction === 'in' ? -payload.amount : payload.amount
      await db.customers().update({ current_balance: (cust.current_balance ?? 0) + change }).eq('id', payload.customerId)
    }
    if (payload.paymentMethod === 'cash') {
      const { data: reg } = await db.cash_registers().select('id, current_balance').eq('is_active', true).single()
      if (reg) {
        const change = payload.direction === 'in' ? payload.amount : -payload.amount
        const newBal = (reg.current_balance ?? 0) + change
        await db.cash_registers().update({ current_balance: newBal }).eq('id', reg.id)
        await db.cash_movements().insert({
          register_id: reg.id, movement_type: payload.direction === 'in' ? 'in' : 'out',
          source: payload.direction === 'in' ? 'revenue' : 'expense',
          reference_id: pay.id, reference_no: payNo as string, amount: payload.amount,
          balance_after: newBal, description: `${payload.direction === 'in' ? 'دفعة من' : 'دفعة إلى'} عميل - ${payNo}`,
          user_id: payload.userId
        })
      }
    }
    return { success: true, paymentNo: payNo as string }
  } catch (e: any) { return { success: false, error: e.message } }
}
