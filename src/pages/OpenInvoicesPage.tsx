import React, { useState, useEffect, useMemo } from 'react'
import {
  useOpenInvoices, getOpenInvoice,
  addItemToOpenInvoice, removeItemFromOpenInvoice, updateInvoiceItem,
  addPaymentToInvoice, updatePayment, deletePayment,
  closeOpenInvoice, createOpenInvoice
} from '@/hooks/useOpenInvoices'
import { useAppStore } from '@/store/useAppStore'
import { db } from '@/lib/supabase'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import ColorPicker from '@/components/pos/ColorPicker'
import PrintInvoice from '@/components/pos/PrintInvoice'
import {
  Plus, Search, X, FileText, Eye, AlertCircle, Trash2,
  DollarSign, Lock, UserPlus, Edit2, Palette, Tag,
  ShoppingCart
} from 'lucide-react'

export default function OpenInvoicesPage() {
  const [showNew, setShowNew] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const { data: invoices, loading, refresh } = useOpenInvoices()

  const filtered = invoices.filter((inv: any) => {
    if (!search) return true
    const term = search.toLowerCase()
    return inv.invoice_no?.toLowerCase().includes(term) || (inv.customer as any)?.name?.toLowerCase().includes(term)
  })

  const totalOpen = invoices.reduce((s, i: any) => s + (i.remaining ?? 0), 0)
  const totalAmount = invoices.reduce((s, i: any) => s + (i.total ?? 0), 0)

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">📂 الفواتير المفتوحة</h1>
          <p className="text-sm text-gray-500">{invoices.length} فاتورة</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-bold shadow-lg" style={{ background: 'linear-gradient(to left, #F59E0B, #D97706)' }}>
          <Plus size={16} /> فاتورة جديدة
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center"><FileText size={20} className="text-amber-600" /></div>
          <div><p className="text-lg font-black text-amber-700">{invoices.length}</p><p className="text-xs text-gray-500">عدد الفواتير</p></div>
        </div>
        <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center"><DollarSign size={20} className="text-blue-600" /></div>
          <div><p className="text-lg font-black text-blue-700">{formatCurrency(totalAmount)}</p><p className="text-xs text-gray-500">إجمالي القيمة</p></div>
        </div>
        <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center"><AlertCircle size={20} className="text-red-600" /></div>
          <div><p className="text-lg font-black text-red-700">{formatCurrency(totalOpen)}</p><p className="text-xs text-gray-500">المتبقي</p></div>
        </div>
      </div>

      <div className="relative">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="w-full pr-9 pl-3 py-2.5 bg-white border-2 rounded-xl text-sm outline-none focus:border-amber-400" />
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white" style={{ background: 'linear-gradient(to left, #F59E0B, #D97706)' }}>
              {['الفاتورة','التاريخ','العميل','الأصناف','الإجمالي','المدفوع','المتبقي','إجراءات'].map(h => (
                <th key={h} className="py-3 px-4 text-right text-xs font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="text-center py-20 text-gray-400">⏳</td></tr> :
             filtered.length === 0 ? <tr><td colSpan={8} className="text-center py-20"><FileText size={32} className="mx-auto mb-2 text-gray-300" /><p className="text-gray-400">لا توجد فواتير</p></td></tr> :
             filtered.map((inv: any) => (
              <tr key={inv.id} className="border-b border-gray-50 hover:bg-amber-50/20">
                <td className="py-3 px-4 font-mono text-xs font-bold text-amber-700">{inv.invoice_no}</td>
                <td className="py-3 px-4 text-xs text-gray-500">{formatDate(inv.date)}</td>
                <td className="py-3 px-4 text-xs font-bold">{(inv.customer as any)?.name ?? '-'}</td>
                <td className="py-3 px-4 text-xs">{inv.items?.length ?? 0}</td>
                <td className="py-3 px-4 text-xs font-black" style={{ color: '#D4AF37' }}>{formatCurrency(inv.total)}</td>
                <td className="py-3 px-4 text-xs font-bold text-green-600">{formatCurrency(inv.paid)}</td>
                <td className="py-3 px-4 text-xs font-bold text-red-500">{formatCurrency(inv.remaining)}</td>
                <td className="py-3 px-4">
                  <button onClick={() => setSelectedId(inv.id)} className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-200">
                    <Eye size={11} className="inline ml-1" /> فتح
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && <NewInvoiceModal onClose={() => setShowNew(false)} onCreated={(id: string) => { refresh(); setSelectedId(id) }} />}
      {selectedId && <FullInvoiceModal saleId={selectedId} onClose={() => setSelectedId(null)} onChange={refresh} />}
    </div>
  )
}

function FullInvoiceModal({ saleId, onClose, onChange }: any) {
  const { user, activeWarehouse, settings } = useAppStore()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [allVariants, setAllVariants] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState(0)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState('cash')
  const [payNotes, setPayNotes] = useState('')
  const [editingPayment, setEditingPayment] = useState<any>(null)
  const [printData, setPrintData] = useState<any>(null)
  const [showPaymentsList, setShowPaymentsList] = useState(false)
  const [addingItem, setAddingItem] = useState(false)

  useEffect(() => { load() }, [saleId])

  useEffect(() => {
    db.product_variants()
      .select(`id, size_name, sku, barcode, cost_price, sale_price, product:products!inner(id, name, is_active, category_id)`)
      .eq('is_active', true).eq('product.is_active', true).order('sku').limit(2000)
      .then(({ data }) => { if (data) setAllVariants(data) })

    db.categories().select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  const filteredVariants = useMemo(() => {
    let result = allVariants
    if (activeCategory) result = result.filter((v: any) => v.product?.category_id === activeCategory)
    if (search.length >= 1) {
      const term = search.toLowerCase().trim()
      result = result.filter((v: any) => {
        const name = (v.product?.name ?? '').toLowerCase()
        const size = (v.size_name ?? '').toLowerCase()
        const sku = (v.sku ?? '').toLowerCase()
        return name.includes(term) || size.includes(term) || sku.includes(term) || v.barcode === search
      })
    }
    return result.slice(0, 80)
  }, [allVariants, search, activeCategory])

  async function load() {
    setLoading(true)
    const r = await getOpenInvoice(saleId)
    if (r.success) { setInvoice(r.invoice); setDiscountValue(r.invoice.discount_value ?? 0) }
    setLoading(false)
  }

  async function handleQuickAdd(v: any) {
    if (!activeWarehouse?.id || addingItem) return
    setAddingItem(true)

    // تحديث فوري
    const newItem = { id: 'temp_' + Date.now(), variant_id: v.id, product_name: v.product.name, size_name: v.size_name, quantity: 1, unit_price: v.sale_price, total: v.sale_price, cost_price: v.cost_price, color: null }
    setInvoice((prev: any) => ({ ...prev, items: [...(prev.items ?? []), newItem], total: (prev.total ?? 0) + v.sale_price, subtotal: (prev.subtotal ?? 0) + v.sale_price, remaining: (prev.remaining ?? 0) + v.sale_price }))

    // حفظ في الخلفية
    const r = await addItemToOpenInvoice(saleId, { variantId: v.id, productName: v.product.name, sizeName: v.size_name, quantity: 1, unitPrice: v.sale_price, costPrice: v.cost_price }, activeWarehouse.id, user?.id)
    setAddingItem(false)
    if (r.success) load()
    else alert(r.error)
  }

  function handleUpdateItemQty(itemId: string, newQty: number) {
    if (newQty <= 0 || newQty > 9999 || itemId.startsWith('temp_')) return
    const item = (invoice.items ?? []).find((i: any) => i.id === itemId)
    if (!item) return

    const oldTotal = item.total ?? 0
    const newTotal = newQty * item.unit_price
    setInvoice((prev: any) => ({ ...prev, items: (prev.items ?? []).map((i: any) => i.id === itemId ? { ...i, quantity: newQty, total: newTotal } : i), total: (prev.total ?? 0) - oldTotal + newTotal, subtotal: (prev.subtotal ?? 0) - oldTotal + newTotal, remaining: (prev.remaining ?? 0) - oldTotal + newTotal }))
    updateInvoiceItem(itemId, { quantity: newQty })
  }

  function handleUpdateItemPrice(itemId: string, newPrice: number) {
    if (newPrice < 0 || newPrice > 999999 || itemId.startsWith('temp_')) return
    const item = (invoice.items ?? []).find((i: any) => i.id === itemId)
    if (!item) return

    const oldTotal = item.total ?? 0
    const newTotal = item.quantity * newPrice
    setInvoice((prev: any) => ({ ...prev, items: (prev.items ?? []).map((i: any) => i.id === itemId ? { ...i, unit_price: newPrice, total: newTotal } : i), total: (prev.total ?? 0) - oldTotal + newTotal, subtotal: (prev.subtotal ?? 0) - oldTotal + newTotal, remaining: (prev.remaining ?? 0) - oldTotal + newTotal }))
    updateInvoiceItem(itemId, { unit_price: newPrice })
  }

  function handleRemoveItem(itemId: string) {
    if (!activeWarehouse?.id || itemId.startsWith('temp_')) return
    const removedItem = (invoice.items ?? []).find((i: any) => i.id === itemId)
    setInvoice((prev: any) => ({ ...prev, items: (prev.items ?? []).filter((i: any) => i.id !== itemId), total: Math.max(0, (prev.total ?? 0) - (removedItem?.total ?? 0)), subtotal: Math.max(0, (prev.subtotal ?? 0) - (removedItem?.total ?? 0)), remaining: Math.max(0, (prev.remaining ?? 0) - (removedItem?.total ?? 0)) }))
    removeItemFromOpenInvoice(itemId, activeWarehouse.id, user?.id).then(r => { if (r.success) load() })
  }

  async function handleAddColor(itemId: string, color: any) {
    const item = (invoice.items ?? []).find((i: any) => i.id === itemId)
    if (!item || !activeWarehouse?.id) return
    await removeItemFromOpenInvoice(itemId, activeWarehouse.id, user?.id)
    await addItemToOpenInvoice(saleId, { variantId: item.variant_id, productName: item.product_name, sizeName: item.size_name, quantity: item.quantity, unitPrice: item.unit_price, costPrice: item.cost_price ?? 0, color: { colorId: color.id, colorCode: color.color_code, colorName: color.color_name_ar ?? color.color_name } }, activeWarehouse.id, user?.id)
    setShowColorPicker(null); load()
  }

  async function handlePay() {
    if (payAmount <= 0) { alert('أدخل مبلغ'); return }
    const r = await addPaymentToInvoice(saleId, payAmount, payMethod, payNotes, user?.id)
    if (r.success) { setPayAmount(0); setPayNotes(''); setShowPaymentForm(false); load() } else alert(r.error)
  }

  function handleDeletePayment(paymentId: string) {
    deletePayment(paymentId, user?.id).then(r => { if (r.success) load() })
  }

  async function handleCloseAndPrint() {
    if ((invoice.items?.length ?? 0) === 0) { alert('فارغة'); return }
    if (!confirm('إغلاق نهائي؟')) return
    const r = await closeOpenInvoice(saleId)
    if (!r.success) { alert(r.error); return }
    const items = (invoice.items ?? []).map((item: any) => ({ product_name: item.product_name, size_name: item.size_name, quantity: item.quantity, unit_price: item.unit_price, total: item.total, color_code: item.color?.[0]?.color_code ?? null, color_name: item.color?.[0]?.color_name ?? null }))
    const sub = items.reduce((s: number, i: any) => s + i.total, 0)
    let disc = discountType === 'percentage' ? sub * (discountValue / 100) : discountValue
    setPrintData({ invoice_no: invoice.invoice_no, date: new Date().toISOString(), is_tax_invoice: false, subtotal: sub, discount_amount: disc, tax_rate: 0, tax_amount: 0, total: sub - disc, paid: invoice.paid, remaining: Math.max(0, sub - disc - invoice.paid), customer_name: invoice.customer?.name, customer_phone: invoice.customer?.phone, items })
    onChange?.()
  }

  if (loading || !invoice) return <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}><div className="bg-white rounded-2xl p-12 text-center">⏳</div></div>

  const subtotal = (invoice.items ?? []).reduce((s: number, i: any) => s + (i.total ?? 0), 0)
  let discountAmount = discountType === 'percentage' ? subtotal * (discountValue / 100) : Math.min(discountValue, subtotal)
  const finalTotal = subtotal - discountAmount

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} dir="rtl">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] flex overflow-hidden">

          <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
            <div className="p-3 border-b bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-black text-amber-700">📂 {invoice.invoice_no}</h3>
                <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="relative">
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 بحث..." className="w-full pr-9 pl-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-amber-400 bg-gray-50" autoFocus />
              </div>
            </div>

            <div className="px-3 py-2 border-b bg-white flex gap-1.5 overflow-x-auto">
              <button onClick={() => setActiveCategory(null)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${activeCategory === null ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'}`}>الكل</button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${activeCategory === cat.id ? 'text-white' : 'bg-gray-100 text-gray-600'}`} style={activeCategory === cat.id ? { backgroundColor: cat.color_hex } : {}}>
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {filteredVariants.map((v: any) => (
                  <button key={v.id} onClick={() => handleQuickAdd(v)} disabled={addingItem} className="bg-white rounded-xl border-2 border-gray-100 p-3 text-right hover:border-amber-400 hover:shadow-md transition-all active:scale-95 disabled:opacity-50">
                    <div className="w-full h-16 rounded-lg mb-2 flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg, #1B2E4B, #1B3A6B)' }}>🎨</div>
                    <p className="text-xs font-bold line-clamp-2 mb-1">{v.product.name}</p>
                    <p className="text-[10px] text-gray-400 mb-1">{v.size_name}</p>
                    <p className="text-sm font-black text-amber-600">{formatCurrency(v.sale_price)}</p>
                  </button>
                ))}
                {filteredVariants.length === 0 && <div className="col-span-full text-center py-12 text-gray-400"><p className="text-3xl mb-2">🎨</p><p>لا توجد منتجات</p></div>}
              </div>
            </div>
          </div>

          <div className="w-[400px] flex-shrink-0 bg-white flex flex-col border-r-2 border-gray-100">
            <div className="text-white p-4" style={{ background: 'linear-gradient(to left, #F59E0B, #D97706)' }}>
              <p className="text-xs opacity-80">العميل</p>
              <p className="text-base font-black">{invoice.customer?.name ?? '-'}</p>
              <p className="text-xs text-amber-100 mt-1">{formatDateTime(invoice.date)}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
              {(invoice.items ?? []).length === 0 ? (
                <div className="text-center py-12 text-gray-400"><ShoppingCart size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">السلة فارغة</p></div>
              ) : (invoice.items as any[]).map((item: any) => (
                <div key={item.id} className="bg-white rounded-xl border p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{item.product_name}</p>
                      <p className="text-[10px] text-gray-400">{item.size_name}</p>
                      {item.color?.[0]?.color_code && <p className="text-[10px] text-purple-600 mt-0.5">🎨 {item.color[0].color_code} - {item.color[0].color_name}</p>}
                    </div>
                    <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600 p-1"><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">الكمية</label>
                      <input type="number" defaultValue={item.quantity} onBlur={e => handleUpdateItemQty(item.id, +e.target.value || 1)} min={1} className="w-full px-2 py-1 border rounded-lg text-center font-bold" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">السعر</label>
                      <input type="number" defaultValue={item.unit_price} onBlur={e => handleUpdateItemPrice(item.id, +e.target.value || 0)} step="0.01" className="w-full px-2 py-1 border rounded-lg text-center font-bold" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">الإجمالي</label>
                      <p className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-center font-black text-sm">{formatCurrency(item.total)}</p>
                    </div>
                  </div>
                  {!item.id.startsWith('temp_') && (
                    <button onClick={() => setShowColorPicker(item.id)} className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${item.color?.[0] ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500 hover:bg-purple-50'}`}>
                      <Palette size={12} /> {item.color?.[0] ? 'تغيير اللون' : 'إضافة لون'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t bg-white p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-gray-400" />
                <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className="text-xs border rounded-lg px-2 py-1">
                  <option value="percentage">خصم %</option>
                  <option value="fixed">خصم ثابت</option>
                </select>
                <input type="number" value={discountValue || ''} onChange={e => setDiscountValue(+e.target.value || 0)} placeholder="0" className="flex-1 text-xs border rounded-lg px-2 py-1 text-center" min={0} />
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-500"><span>المجموع</span><span>{formatCurrency(subtotal)}</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-green-600"><span>الخصم</span><span>- {formatCurrency(discountAmount)}</span></div>}
                <div className="flex justify-between font-black text-base pt-1 border-t"><span>الإجمالي</span><span style={{ color: '#D4AF37' }}>{formatCurrency(finalTotal)}</span></div>
                <div className="flex justify-between text-green-600 text-xs"><span>المدفوع</span><span>{formatCurrency(invoice.paid)}</span></div>
                {(finalTotal - invoice.paid) > 0 && <div className="flex justify-between text-red-600 font-bold text-sm"><span>المتبقي</span><span>{formatCurrency(finalTotal - invoice.paid)}</span></div>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setShowPaymentForm(true)} className="py-2 bg-green-600 text-white rounded-xl text-xs font-bold">💰 دفعة</button>
                <button onClick={() => setShowPaymentsList(true)} className="py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">📜 الدفعات ({invoice.payments?.length ?? 0})</button>
              </div>

              <button onClick={handleCloseAndPrint} disabled={(invoice.items?.length ?? 0) === 0} className="w-full py-3 text-white font-black rounded-xl shadow-lg disabled:opacity-50" style={{ background: 'linear-gradient(to left, #DC2626, #991B1B)' }}>
                <Lock size={14} className="inline ml-1" /> إنهاء + طباعة
              </button>
            </div>
          </div>
        </div>
      </div>

      {showColorPicker && <ColorPicker onSelect={(c) => handleAddColor(showColorPicker!, c)} onClose={() => setShowColorPicker(null)} />}

      {showPaymentForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setShowPaymentForm(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between mb-4"><h3 className="text-lg font-black text-green-600">💰 دفعة</h3><button onClick={() => setShowPaymentForm(false)}><X size={20} /></button></div>
            <div className="bg-red-50 rounded-xl p-3 mb-4 text-center"><p className="text-xs text-gray-500">المتبقي</p><p className="text-2xl font-black text-red-600">{formatCurrency(finalTotal - invoice.paid)}</p></div>
            <input type="number" value={payAmount || ''} onChange={e => setPayAmount(+e.target.value || 0)} className="w-full px-3 py-3 border-2 rounded-xl text-2xl font-black text-center mb-3" autoFocus />
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button onClick={() => setPayAmount(finalTotal - invoice.paid)} className="py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">الكل</button>
              <button onClick={() => setPayAmount((finalTotal - invoice.paid) / 2)} className="py-2 bg-gray-50 text-gray-700 rounded-lg text-xs font-bold">النصف</button>
            </div>
            <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full px-3 py-2.5 border-2 rounded-xl mb-3 bg-white"><option value="cash">نقدي</option><option value="bank_transfer">تحويل</option><option value="visa">فيزا</option></select>
            <input value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="ملاحظات..." className="w-full px-3 py-2.5 border-2 rounded-xl mb-3 text-sm" />
            <div className="flex gap-3">
              <button onClick={() => setShowPaymentForm(false)} className="flex-1 py-2.5 border-2 rounded-xl font-bold">إلغاء</button>
              <button onClick={handlePay} className="flex-1 py-2.5 bg-green-600 text-white font-bold rounded-xl">💰 حفظ</button>
            </div>
          </div>
        </div>
      )}

      {showPaymentsList && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setShowPaymentsList(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex justify-between p-5 border-b"><h3 className="text-lg font-black text-blue-600">📜 الدفعات</h3><button onClick={() => setShowPaymentsList(false)}><X size={20} /></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {(invoice.payments ?? []).length === 0 ? <div className="text-center py-12 text-gray-400">لا توجد دفعات</div> :
               (invoice.payments as any[]).map((p: any) => (
                <div key={p.id} className="bg-gray-50 rounded-xl p-3 flex justify-between">
                  <div>
                    <p className="text-base font-black text-green-700">{formatCurrency(p.amount)}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(p.date)}</p>
                    {p.notes && <p className="text-xs text-gray-600 mt-1">{p.notes}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditingPayment(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                    <button onClick={() => handleDeletePayment(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editingPayment && <EditPaymentModal payment={editingPayment} onClose={() => setEditingPayment(null)} onSaved={() => { setEditingPayment(null); load() }} />}
      {printData && <PrintInvoice invoice={printData} storeName={settings?.store_name} storePhone={settings?.store_phone ?? undefined} storeAddress={settings?.store_address ?? undefined} receiptFooter={settings?.receipt_footer} onClose={() => { setPrintData(null); onClose() }} />}
    </>
  )
}

function EditPaymentModal({ payment, onClose, onSaved }: any) {
  const { user } = useAppStore()
  const [amount, setAmount] = useState(payment.amount)
  const [method, setMethod] = useState(payment.payment_method)
  const [notes, setNotes] = useState(payment.notes ?? '')

  async function handleSave() {
    if (amount <= 0) { alert('المبلغ مطلوب'); return }
    const r = await updatePayment(payment.id, amount, method, notes, user?.id)
    if (r.success) onSaved(); else alert(r.error)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between p-5 border-b"><h3 className="text-lg font-black text-blue-600">✏️ تعديل</h3><button onClick={onClose}><X size={20} /></button></div>
        <div className="p-5 space-y-3">
          <input type="number" value={amount} onChange={e => setAmount(+e.target.value || 0)} className="w-full px-3 py-3 border-2 rounded-xl text-2xl font-black text-center" autoFocus />
          <select value={method} onChange={e => setMethod(e.target.value)} className="w-full px-3 py-2.5 border-2 rounded-xl bg-white"><option value="cash">نقدي</option><option value="bank_transfer">تحويل</option><option value="visa">فيزا</option></select>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات..." className="w-full px-3 py-2.5 border-2 rounded-xl text-sm" />
        </div>
        <div className="p-5 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 rounded-xl font-bold">إلغاء</button>
          <button onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl">حفظ</button>
        </div>
      </div>
    </div>
  )
}

function NewInvoiceModal({ onClose, onCreated }: any) {
  const { user, activeWarehouse } = useAppStore()
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newType, setNewType] = useState('retail')

  useEffect(() => {
    if (showNewCustomer) return
    let q = db.customers().select('id, code, name, phone, customer_type, current_balance').eq('is_active', true).order('name').limit(30)
    if (search.length >= 1) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
    q.then(({ data }) => setCustomers(data ?? []))
  }, [search, showNewCustomer])

  async function handleCreate(customerId: string) {
    if (!activeWarehouse?.id) return
    setCreating(true)
    const r = await createOpenInvoice(customerId, activeWarehouse.id, user?.id)
    setCreating(false)
    if (r.success) { onCreated?.(r.sale.id); onClose() } else alert(r.error)
  }

  async function handleAddNew() {
    if (!newName.trim()) { alert('الاسم مطلوب'); return }
    setCreating(true)
    const { count } = await db.customers().select('id', { count: 'exact', head: true })
    const code = `CUS-${String((count ?? 0) + 1).padStart(5, '0')}`
    const { data: newCust, error } = await db.customers().insert({ name: newName.trim(), phone: newPhone.trim() || null, code, customer_type: newType, is_active: true }).select().single()
    if (error || !newCust || !activeWarehouse?.id) { setCreating(false); alert(error?.message); return }
    const r = await createOpenInvoice(newCust.id, activeWarehouse.id, user?.id)
    setCreating(false)
    if (r.success) { onCreated?.(r.sale.id); onClose() } else alert(r.error)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="flex justify-between p-4 border-b">
          <h3 className="text-lg font-black">{showNewCustomer ? '➕ عميل + فاتورة' : '➕ فاتورة جديدة'}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        {showNewCustomer ? (
          <>
            <div className="p-4 space-y-3">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="اسم العميل *" className="w-full px-3 py-2.5 border-2 rounded-xl" autoFocus />
              <input value={newPhone} onChange={e => setNewPhone(e.target.value)} type="tel" placeholder="الهاتف" className="w-full px-3 py-2.5 border-2 rounded-xl" />
              <select value={newType} onChange={e => setNewType(e.target.value)} className="w-full px-3 py-2.5 border-2 rounded-xl bg-white">
                <option value="retail">عادي</option><option value="contractor">مقاول</option><option value="engineer">مهندس</option><option value="company">شركة</option><option value="distributor">موزع</option>
              </select>
            </div>
            <div className="p-4 border-t flex gap-2">
              <button onClick={() => setShowNewCustomer(false)} className="flex-1 py-2.5 border-2 rounded-xl font-bold">← رجوع</button>
              <button onClick={handleAddNew} disabled={creating} className="flex-1 py-2.5 text-white font-bold rounded-xl" style={{ background: 'linear-gradient(to left, #F59E0B, #D97706)' }}>{creating ? '⏳' : '✅ إنشاء'}</button>
            </div>
          </>
        ) : (
          <>
            <div className="p-3 border-b space-y-2">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 بحث..." className="w-full px-3 py-2 border-2 rounded-lg" />
              <button onClick={() => setShowNewCustomer(true)} className="w-full py-2 bg-amber-50 text-amber-700 rounded-lg font-bold flex justify-center items-center gap-2"><UserPlus size={14} /> عميل جديد</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {customers.map((c: any) => (
                <button key={c.id} onClick={() => handleCreate(c.id)} disabled={creating} className="w-full p-3 bg-gray-50 hover:bg-amber-50 rounded-xl text-right">
                  <p className="text-sm font-bold">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.code} | {c.phone ?? '-'}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
