import React, { useState } from 'react'
import { usePurchasesList, useSearchVariants, useActiveSuppliers, createPurchase } from '@/hooks/usePurchases'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search, X, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react'

function NewPurchaseModal({ onClose, onSaved }: any) {
  const { activeWarehouse, user } = useAppStore()
  const suppliers = useActiveSuppliers()
  const [supplierId, setSupplierId]       = useState('')
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('')
  const [date, setDate]                   = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes]                 = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paid, setPaid]                   = useState(0)
  const [searchVar, setSearchVar]         = useState('')
  const [items, setItems]                 = useState<any[]>([])
  const [saving, setSaving]               = useState(false)
  const variants = useSearchVariants(searchVar)

  function addItem(v: any) {
    setItems(p => [...p, {
      variantId: v.id, productName: v.product?.name, sizeName: v.size_name,
      quantity: 1, unitCost: v.cost_price, discountPct: 0, total: v.cost_price
    }])
    setSearchVar('')
  }

  function updateItem(i: number, k: string, val: any) {
    setItems(p => p.map((it, idx) => {
      if (idx !== i) return it
      const updated = { ...it, [k]: val }
      updated.total = updated.quantity * updated.unitCost * (1 - updated.discountPct / 100)
      return updated
    }))
  }

  const subtotal = items.reduce((s, i) => s + i.total, 0)
  const canSave = supplierId && items.length > 0

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    const r = await createPurchase({
      supplierId, warehouseId: activeWarehouse?.id, supplierInvoiceNo, date,
      items, subtotal, total: subtotal, paid, remaining: subtotal - paid,
      paymentMethod, notes, userId: user?.id
    })
    setSaving(false)
    if (r.success) {
      alert(`✅ تم: ${r.poNo}`)
      onSaved(); onClose()
    } else alert(r.error)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-black">➕ فاتورة شراء جديدة</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1">المورد *</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-blue-400">
                <option value="">اختر المورد</option>
                {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">رقم فاتورة المورد</label>
              <input value={supplierInvoiceNo} onChange={e => setSupplierInvoiceNo(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">التاريخ</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">طريقة الدفع</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white outline-none">
                <option value="cash">نقدي</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="credit">آجل</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">إضافة أصناف</label>
            <div className="relative">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchVar} onChange={e => setSearchVar(e.target.value)} placeholder="ابحث بالاسم أو الباركود..."
                className="w-full pr-9 pl-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none bg-gray-50" />
            </div>
            {variants.length > 0 && (
              <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden shadow-lg max-h-48 overflow-y-auto">
                {variants.map((v: any) => (
                  <button key={v.id} onClick={() => addItem(v)}
                    className="w-full flex justify-between items-center px-4 py-2.5 hover:bg-blue-50 text-right border-b border-gray-50 last:border-0">
                    <span className="text-sm font-bold">{v.product?.name} - {v.size_name}</span>
                    <span className="text-xs font-bold" style={{ color: '#D4AF37' }}>{formatCurrency(v.cost_price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="py-2 px-3 text-right">الصنف</th>
                    <th className="py-2 px-3 text-center">الكمية</th>
                    <th className="py-2 px-3 text-center">سعر الشراء</th>
                    <th className="py-2 px-3 text-center">خصم%</th>
                    <th className="py-2 px-3 text-left">الإجمالي</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-2 px-3 text-xs font-bold">{item.productName} - {item.sizeName}</td>
                      <td className="py-2 px-3"><input type="number" value={item.quantity} min={1} onChange={e => updateItem(i, 'quantity', +e.target.value)} className="w-16 text-center border rounded-lg px-2 py-1 text-xs" /></td>
                      <td className="py-2 px-3"><input type="number" value={item.unitCost} step="0.01" onChange={e => updateItem(i, 'unitCost', +e.target.value)} className="w-24 text-center border rounded-lg px-2 py-1 text-xs" /></td>
                      <td className="py-2 px-3"><input type="number" value={item.discountPct} min={0} max={100} onChange={e => updateItem(i, 'discountPct', +e.target.value)} className="w-16 text-center border rounded-lg px-2 py-1 text-xs" /></td>
                      <td className="py-2 px-3 text-xs font-bold" style={{ color: '#D4AF37' }}>{formatCurrency(item.total)}</td>
                      <td className="py-2 px-3"><button onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} className="text-red-400"><X size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-t">
                <span className="text-sm font-bold">الإجمالي</span>
                <span className="text-lg font-black" style={{ color: '#D4AF37' }}>{formatCurrency(subtotal)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1">المبلغ المدفوع</label>
              <input type="number" value={paid || ''} onChange={e => setPaid(+e.target.value || 0)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">ملاحظات</label>
              <input value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
            </div>
          </div>
        </div>
        <div className="p-5 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 rounded-xl font-bold hover:bg-gray-50">إلغاء</button>
          <button onClick={handleSave} disabled={!canSave || saving} className="flex-2 px-8 py-2.5 text-white font-bold rounded-xl disabled:opacity-40"
            style={{ background: 'linear-gradient(to left, #1B3A6B, #1B2E4B)' }}>
            {saving ? '⏳' : '✅ حفظ الفاتورة'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PurchasesPage() {
  const [showNew, setShowNew] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { data, loading, refresh } = usePurchasesList()

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">🛍️ فواتير المشتريات</h1>
          <p className="text-sm text-gray-500">{data.length} فاتورة</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-bold shadow-lg hover:opacity-90"
          style={{ background: 'linear-gradient(to left, #1B3A6B, #1B2E4B)' }}>
          <Plus size={16} /> فاتورة شراء
        </button>
      </div>

      <div className="space-y-3">
        {loading ? <div className="text-center py-20 text-gray-400">⏳</div> :
          data.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center"><ShoppingBag size={32} className="mx-auto mb-2 text-gray-300" /><p className="text-gray-400">لا توجد فواتير</p></div> :
          data.map((p: any) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                <div>
                  <p className="text-sm font-black font-mono" style={{ color: '#1B3A6B' }}>{p.po_no}</p>
                  <p className="text-xs text-gray-500">{p.supplier?.name} | {formatDate(p.date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <p className="text-base font-black" style={{ color: '#D4AF37' }}>{formatCurrency(p.total)}</p>
                    {p.remaining > 0 && <p className="text-xs text-red-500 font-bold">متبقي: {formatCurrency(p.remaining)}</p>}
                  </div>
                  {expandedId === p.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
              {expandedId === p.id && (
                <div className="border-t border-gray-50 px-4 py-3">
                  <table className="w-full text-xs">
                    <thead><tr className="text-gray-400"><th className="text-right py-1">الصنف</th><th className="text-center">الكمية</th><th className="text-left">التكلفة</th></tr></thead>
                    <tbody>
                      {(p.items ?? []).map((it: any) => (
                        <tr key={it.id} className="border-t">
                          <td className="py-1.5 font-bold">{it.variant?.product?.name} - {it.variant?.size_name}</td>
                          <td className="py-1.5 text-center">{it.quantity}</td>
                          <td className="py-1.5 text-left font-bold" style={{ color: '#D4AF37' }}>{formatCurrency(it.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        }
      </div>

      {showNew && <NewPurchaseModal onClose={() => setShowNew(false)} onSaved={refresh} />}
    </div>
  )
}