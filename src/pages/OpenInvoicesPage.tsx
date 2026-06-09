import React, { useState, useEffect } from 'react'
import {
  useOpenInvoices, getOpenInvoice,
  addItemToOpenInvoice, removeItemFromOpenInvoice,
  addPaymentToInvoice, updatePayment, deletePayment,
  closeOpenInvoice, createOpenInvoice
} from '@/hooks/useOpenInvoices'
import { useAppStore } from '@/store/useAppStore'
import { db } from '@/lib/supabase'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import {
  Plus, Search, X, FileText, Eye,
  AlertCircle, Trash2, DollarSign, Lock, UserPlus, Edit2
} from 'lucide-react'

function OpenInvoiceDetailModal({ saleId, onClose, onChange }: any) {
  const { user, activeWarehouse } = useAppStore()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'items' | 'add-item' | 'payment' | 'payments-list'>('items')

  const [search, setSearch] = useState('')
  const [allVariants, setAllVariants] = useState<any[]>([])
  const [filteredVariants, setFilteredVariants] = useState<any[]>([])
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [qty, setQty] = useState(1)
  const [price, setPrice] = useState(0)

  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState('cash')
  const [payNotes, setPayNotes] = useState('')

  // 🆕 لتعديل الدفعات
  const [editingPayment, setEditingPayment] = useState<any>(null)

  useEffect(() => { load() }, [saleId])

  useEffect(() => {
    setLoadingVariants(true)
    db.product_variants()
      .select(`id, size_name, sku, barcode, cost_price, sale_price, product:products!inner(id, name, is_active)`)
      .eq('is_active', true)
      .eq('product.is_active', true)
      .order('sku')
      .limit(2000)
      .then(({ data }) => {
        if (data) {
          setAllVariants(data)
          setFilteredVariants(data.slice(0, 30))
        }
        setLoadingVariants(false)
      })
  }, [])

  useEffect(() => {
    if (search.length === 0) {
      setFilteredVariants(allVariants.slice(0, 30))
      return
    }
    const term = search.toLowerCase().trim()
    const filtered = allVariants.filter((v: any) => {
      const name = (v.product?.name ?? '').toLowerCase()
      const size = (v.size_name ?? '').toLowerCase()
      const sku = (v.sku ?? '').toLowerCase()
      const barcode = v.barcode ?? ''
      return name.includes(term) ||
             size.includes(term) ||
             sku.includes(term) ||
             barcode === search
    }).slice(0, 50)
    setFilteredVariants(filtered)
  }, [search, allVariants])

  async function load() {
    setLoading(true)
    const r = await getOpenInvoice(saleId)
    if (r.success) setInvoice(r.invoice)
    setLoading(false)
  }

  async function handleAddItem() {
    if (!selectedVariant || qty <= 0 || price <= 0) {
      alert('املأ كل البيانات'); return
    }
    if (!activeWarehouse?.id) { alert('لا يوجد مخزن'); return }

    const r = await addItemToOpenInvoice(
      saleId,
      {
        variantId: selectedVariant.id,
        productName: selectedVariant.product.name,
        sizeName: selectedVariant.size_name,
        quantity: qty,
        unitPrice: price,
        costPrice: selectedVariant.cost_price
      },
      activeWarehouse.id,
      user?.id
    )
    if (r.success) {
      setSelectedVariant(null); setQty(1); setPrice(0); setSearch('')
      load(); onChange?.()
    } else alert(r.error)
  }

  async function handleRemoveItem(itemId: string) {
    if (!confirm('حذف هذا الصنف؟')) return
    if (!activeWarehouse?.id) return
    const r = await removeItemFromOpenInvoice(itemId, activeWarehouse.id, user?.id)
    if (r.success) { load(); onChange?.() }
    else alert(r.error)
  }

  async function handlePay() {
    if (payAmount <= 0) { alert('أدخل مبلغ صحيح'); return }
    const r = await addPaymentToInvoice(saleId, payAmount, payMethod, payNotes, user?.id)
    if (r.success) {
      alert(`✅ تم دفع ${formatCurrency(payAmount)}`)
      setPayAmount(0); setPayNotes('')
      load(); onChange?.()
    } else alert(r.error)
  }

  async function handleDeletePayment(paymentId: string, amount: number) {
    if (!confirm(`حذف دفعة بقيمة ${formatCurrency(amount)}؟\n\n⚠️ سيتم:\n- خصم المبلغ من الخزينة\n- إعادة المديونية للعميل`)) return
    const r = await deletePayment(paymentId, user?.id)
    if (r.success) {
      alert('✅ تم حذف الدفعة')
      load(); onChange?.()
    } else alert(r.error)
  }

  async function handleClose() {
    if (!confirm('إغلاق الفاتورة نهائياً؟ لن يمكن تعديلها بعد ذلك.')) return
    const r = await closeOpenInvoice(saleId)
    if (r.success) {
      alert('✅ تم إغلاق الفاتورة')
      onChange?.(); onClose()
    } else alert(r.error)
  }

  if (loading || !invoice) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="bg-white rounded-2xl p-12 text-center">⏳ جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} dir="rtl">
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4">

        <div className="text-white p-5 rounded-t-2xl" style={{ background: 'linear-gradient(to left, #F59E0B, #D97706)' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-black font-mono">{invoice.invoice_no}</h3>
              <p className="text-amber-200 text-sm mt-1">
                🟡 فاتورة مفتوحة | {invoice.customer?.name}
              </p>
              <p className="text-amber-100 text-xs mt-1">{formatDateTime(invoice.date)}</p>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white"><X size={22} /></button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-lg font-black">{formatCurrency(invoice.total)}</p>
              <p className="text-[10px] text-amber-200">الإجمالي</p>
            </div>
            <div className="bg-green-500/30 rounded-xl p-3 text-center">
              <p className="text-lg font-black">{formatCurrency(invoice.paid)}</p>
              <p className="text-[10px] text-amber-200">المدفوع</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${invoice.remaining > 0 ? 'bg-red-500/30' : 'bg-white/10'}`}>
              <p className="text-lg font-black">{formatCurrency(invoice.remaining)}</p>
              <p className="text-[10px] text-amber-200">المتبقي</p>
            </div>
          </div>
        </div>

        <div className="flex border-b bg-gray-50 overflow-x-auto">
          <button onClick={() => setTab('items')} className={`flex-1 min-w-fit py-3 text-sm font-bold whitespace-nowrap px-3 ${tab === 'items' ? 'bg-white border-b-2 border-amber-500 text-amber-600' : 'text-gray-500'}`}>
            📦 الأصناف ({invoice.items?.length ?? 0})
          </button>
          <button onClick={() => setTab('add-item')} className={`flex-1 min-w-fit py-3 text-sm font-bold whitespace-nowrap px-3 ${tab === 'add-item' ? 'bg-white border-b-2 border-amber-500 text-amber-600' : 'text-gray-500'}`}>
            ➕ إضافة صنف
          </button>
          <button onClick={() => setTab('payment')} className={`flex-1 min-w-fit py-3 text-sm font-bold whitespace-nowrap px-3 ${tab === 'payment' ? 'bg-white border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}>
            💰 دفعة جديدة
          </button>
          <button onClick={() => setTab('payments-list')} className={`flex-1 min-w-fit py-3 text-sm font-bold whitespace-nowrap px-3 ${tab === 'payments-list' ? 'bg-white border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>
            📜 الدفعات ({invoice.payments?.length ?? 0})
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-4">
          {tab === 'items' && (
            <div className="space-y-2">
              {(invoice.items ?? []).length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-4xl mb-2">📦</p>
                  <p>لا توجد أصناف</p>
                </div>
              ) : (invoice.items as any[]).map((item: any) => (
                <div key={item.id} className="bg-gray-50 rounded-xl p-3 flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-bold">{item.product_name}</p>
                    <p className="text-xs text-gray-500">{item.size_name}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {item.quantity} × {formatCurrency(item.unit_price)} =
                      <span className="font-bold text-amber-600"> {formatCurrency(item.total)}</span>
                    </p>
                  </div>
                  <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'add-item' && (
            <div className="space-y-3">
              {!selectedVariant ? (
                <>
                  <div className="relative">
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="🔍 ابحث بالاسم أو الكود أو الحجم..."
                      className="w-full pr-9 pl-3 py-3 border-2 rounded-xl text-sm outline-none focus:border-amber-400"
                      autoFocus
                    />
                  </div>

                  {loadingVariants ? (
                    <div className="text-center py-8 text-gray-400 text-sm">⏳ جاري تحميل المنتجات...</div>
                  ) : (
                    <>
                      <div className="text-xs text-gray-500">
                        {search ? `${filteredVariants.length} نتيجة` : `إجمالي المنتجات: ${allVariants.length}`}
                      </div>
                      <div className="max-h-80 overflow-y-auto space-y-1 border rounded-xl bg-gray-50 p-2">
                        {filteredVariants.length === 0 ? (
                          <div className="text-center py-8 text-gray-400 text-sm">
                            لا توجد منتجات مطابقة
                          </div>
                        ) : filteredVariants.map((v: any) => (
                          <button
                            key={v.id}
                            onClick={() => { setSelectedVariant(v); setPrice(v.sale_price) }}
                            className="w-full p-3 bg-white hover:bg-amber-50 rounded-xl text-right border border-gray-100 hover:border-amber-300 transition-all"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900">{v.product.name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  📦 {v.size_name}
                                  {v.sku && <span className="mr-2">| كود: {v.sku}</span>}
                                </p>
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-black text-amber-600">{formatCurrency(v.sale_price)}</p>
                                {v.cost_price > 0 && <p className="text-[10px] text-gray-400">شراء: {formatCurrency(v.cost_price)}</p>}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="space-y-3 bg-amber-50 p-4 rounded-xl border-2 border-amber-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-base">{selectedVariant.product.name}</p>
                      <p className="text-sm text-gray-600">{selectedVariant.size_name}</p>
                      {selectedVariant.sku && <p className="text-xs text-gray-500 mt-1">كود: {selectedVariant.sku}</p>}
                    </div>
                    <button onClick={() => setSelectedVariant(null)} className="text-red-500"><X size={20} /></button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">الكمية</label>
                      <input type="number" value={qty} onChange={e => setQty(+e.target.value || 1)} min={1} className="w-full px-3 py-2.5 border-2 rounded-lg text-center text-lg font-bold outline-none focus:border-amber-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">السعر</label>
                      <input type="number" value={price} onChange={e => setPrice(+e.target.value || 0)} step="0.01" className="w-full px-3 py-2.5 border-2 rounded-lg text-center text-lg font-bold outline-none focus:border-amber-400" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">الإجمالي</p>
                    <p className="text-2xl font-black text-amber-600">{formatCurrency(qty * price)}</p>
                  </div>

                  <button onClick={handleAddItem} className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold hover:opacity-90 text-base">
                    ➕ إضافة للفاتورة
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'payment' && (
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">المتبقي على الفاتورة</p>
                <p className="text-2xl font-black text-red-600">{formatCurrency(invoice.remaining)}</p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">المبلغ المراد سداده</label>
                <input type="number" value={payAmount || ''} onChange={e => setPayAmount(+e.target.value || 0)} className="w-full px-3 py-3 border-2 rounded-xl text-2xl font-black text-center outline-none focus:border-green-400" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setPayAmount(invoice.remaining)} className="py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-100">
                  دفع كامل المتبقي
                </button>
                <button onClick={() => setPayAmount(invoice.remaining / 2)} className="py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-100">
                  دفع نصف المتبقي
                </button>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">طريقة الدفع</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm bg-white">
                  <option value="cash">نقدي</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="visa">فيزا</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">ملاحظات</label>
                <input value={payNotes} onChange={e => setPayNotes(e.target.value)} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm" />
              </div>
              <button onClick={handlePay} disabled={payAmount <= 0} className="w-full py-3 bg-green-600 text-white rounded-xl font-black hover:opacity-90 disabled:opacity-50">
                💰 تسجيل الدفعة
              </button>
            </div>
          )}

          {tab === 'payments-list' && (
            <div className="space-y-2">
              {(invoice.payments ?? []).length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <DollarSign size={32} className="mx-auto mb-2" />
                  <p className="text-sm">لا توجد دفعات</p>
                  <p className="text-xs mt-1">اضغط "💰 دفعة جديدة" لتسجيل دفعة</p>
                </div>
              ) : (invoice.payments as any[]).map((p: any) => (
                <div key={p.id} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-base font-black text-green-700">+ {formatCurrency(p.amount)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(p.date)} | {p.payment_method === 'cash' ? '💵 نقدي' : p.payment_method === 'bank_transfer' ? '🏦 تحويل' : '💳 ' + p.payment_method}
                      </p>
                      {p.notes && <p className="text-xs text-gray-600 mt-1">📝 {p.notes}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingPayment(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="تعديل">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeletePayment(p.id, p.amount)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="حذف">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-green-50 rounded-xl p-3 mt-4 text-center border-2 border-green-200">
                <p className="text-xs text-gray-600">إجمالي المدفوعات</p>
                <p className="text-2xl font-black text-green-700">
                  {formatCurrency((invoice.payments ?? []).reduce((s: number, p: any) => s + p.amount, 0))}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 rounded-xl font-bold hover:bg-gray-50">
            إغلاق النافذة
          </button>
          <button onClick={handleClose} disabled={(invoice.items?.length ?? 0) === 0} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-black hover:opacity-90 disabled:opacity-50">
            <Lock size={14} className="inline ml-1" /> إنهاء وإغلاق الفاتورة
          </button>
        </div>
      </div>

      {/* Modal تعديل الدفعة */}
      {editingPayment && (
        <EditPaymentModal
          payment={editingPayment}
          onClose={() => setEditingPayment(null)}
          onSaved={() => { setEditingPayment(null); load(); onChange?.() }}
        />
      )}
    </div>
  )
}

// 🆕 Modal تعديل الدفعة
function EditPaymentModal({ payment, onClose, onSaved }: any) {
  const { user } = useAppStore()
  const [amount, setAmount] = useState(payment.amount)
  const [method, setMethod] = useState(payment.payment_method)
  const [notes, setNotes] = useState(payment.notes ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (amount <= 0) { alert('المبلغ يجب أن يكون أكبر من صفر'); return }
    setSaving(true)
    const r = await updatePayment(payment.id, amount, method, notes, user?.id)
    setSaving(false)
    if (r.success) {
      alert('✅ تم تعديل الدفعة')
      onSaved()
    } else alert(`خطأ: ${r.error}`)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose} dir="rtl">
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-black text-blue-600">✏️ تعديل الدفعة</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="p-5 space-y-3">
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-800">
            💡 المبلغ القديم: {formatCurrency(payment.amount)}
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">المبلغ الجديد *</label>
            <input
              type="number"
              value={amount || ''}
              onChange={e => setAmount(+e.target.value || 0)}
              className="w-full px-3 py-3 border-2 rounded-xl text-2xl font-black text-center outline-none focus:border-blue-400"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">طريقة الدفع</label>
            <select value={method} onChange={e => setMethod(e.target.value)} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm bg-white">
              <option value="cash">نقدي</option>
              <option value="bank_transfer">تحويل بنكي</option>
              <option value="visa">فيزا</option>
              <option value="check">شيك</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">ملاحظات</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm" />
          </div>
        </div>

        <div className="p-5 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 rounded-xl font-bold hover:bg-gray-50">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50">
            {saving ? '⏳' : '💾 حفظ التعديلات'}
          </button>
        </div>
      </div>
    </div>
  )
}

function NewOpenInvoiceModal({ onClose, onCreated }: any) {
  const { user, activeWarehouse } = useAppStore()
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [showNewCustomer, setShowNewCustomer] = useState(false)

  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newType, setNewType] = useState('retail')
  const [savingCustomer, setSavingCustomer] = useState(false)

  useEffect(() => {
    if (showNewCustomer) return
    let q = db.customers().select('id, code, name, phone, customer_type, current_balance').eq('is_active', true).order('name').limit(30)
    if (search.length >= 1) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
    q.then(({ data }) => setCustomers(data ?? []))
  }, [search, showNewCustomer])

  async function handleCreate(customerId: string) {
    if (!activeWarehouse?.id) { alert('لا يوجد مخزن'); return }
    setCreating(true)
    const r = await createOpenInvoice(customerId, activeWarehouse.id, user?.id)
    setCreating(false)
    if (r.success) {
      alert(`✅ تم إنشاء فاتورة مفتوحة: ${r.sale.invoice_no}`)
      onCreated?.(r.sale.id)
      onClose()
    } else alert(r.error)
  }

  async function handleAddNewCustomer() {
    if (!newName.trim()) { alert('اسم العميل مطلوب'); return }
    setSavingCustomer(true)

    const { count } = await db.customers().select('id', { count: 'exact', head: true })
    const code = `CUS-${String((count ?? 0) + 1).padStart(5, '0')}`

    const { data: newCust, error } = await db.customers().insert({
      name: newName.trim(),
      phone: newPhone.trim() || null,
      code,
      customer_type: newType,
      is_active: true
    }).select().single()

    if (error || !newCust) {
      setSavingCustomer(false)
      alert(`خطأ: ${error?.message}`)
      return
    }

    if (!activeWarehouse?.id) {
      setSavingCustomer(false)
      alert('لا يوجد مخزن')
      return
    }

    const r = await createOpenInvoice(newCust.id, activeWarehouse.id, user?.id)
    setSavingCustomer(false)

    if (r.success) {
      alert(`✅ تم إضافة العميل وإنشاء فاتورة: ${r.sale.invoice_no}`)
      onCreated?.(r.sale.id)
      onClose()
    } else {
      alert(r.error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} dir="rtl">
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-black">
            {showNewCustomer ? '➕ عميل جديد + فاتورة' : '➕ فاتورة مفتوحة جديدة'}
          </h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        {showNewCustomer ? (
          <>
            <div className="p-4 space-y-3">
              <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-800">
                💡 سيتم إنشاء العميل وفتح فاتورة له فوراً
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">اسم العميل *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="مثال: محمد أحمد" className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-amber-400" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">رقم الهاتف</label>
                <input value={newPhone} onChange={e => setNewPhone(e.target.value)} type="tel" placeholder="01xxxxxxxxx" className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">نوع العميل</label>
                <select value={newType} onChange={e => setNewType(e.target.value)} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm bg-white outline-none">
                  <option value="retail">عادي</option>
                  <option value="wholesale">جملة</option>
                  <option value="contractor">مقاول</option>
                  <option value="engineer">مهندس</option>
                  <option value="company">شركة</option>
                  <option value="distributor">موزع / وكيل</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t flex gap-2">
              <button onClick={() => setShowNewCustomer(false)} className="flex-1 py-2.5 border-2 rounded-xl font-bold hover:bg-gray-50">← رجوع</button>
              <button onClick={handleAddNewCustomer} disabled={savingCustomer} className="flex-1 py-2.5 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50" style={{ background: 'linear-gradient(to left, #F59E0B, #D97706)' }}>
                {savingCustomer ? '⏳' : '✅ حفظ وإنشاء فاتورة'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-3 border-b space-y-2">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث عن عميل..." className="w-full px-3 py-2 border-2 rounded-lg text-sm" />
              <button onClick={() => setShowNewCustomer(true)} className="w-full py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-bold hover:bg-amber-100 flex items-center justify-center gap-2">
                <UserPlus size={14} /> ➕ إضافة عميل جديد
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {customers.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">لا يوجد عملاء. اضغط "إضافة عميل جديد"</div>
              ) : customers.map((c: any) => (
                <button key={c.id} onClick={() => handleCreate(c.id)} disabled={creating} className="w-full p-3 bg-gray-50 hover:bg-amber-50 rounded-xl text-right">
                  <p className="text-sm font-bold">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.code} | {c.phone ?? '-'} | الرصيد: {formatCurrency(Math.abs(c.current_balance))}{c.current_balance > 0 ? ' (مديونية)' : ''}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function OpenInvoicesPage() {
  const [showNew, setShowNew] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const { data: invoices, loading, refresh } = useOpenInvoices()

  const filtered = invoices.filter((inv: any) => {
    if (!search) return true
    const term = search.toLowerCase()
    return inv.invoice_no?.toLowerCase().includes(term) ||
           (inv.customer as any)?.name?.toLowerCase().includes(term)
  })

  const totalOpen = invoices.reduce((s, i: any) => s + (i.remaining ?? 0), 0)
  const totalAmount = invoices.reduce((s, i: any) => s + (i.total ?? 0), 0)

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">📂 الفواتير المفتوحة</h1>
          <p className="text-sm text-gray-500 mt-0.5">{invoices.length} فاتورة مفتوحة</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-bold shadow-lg" style={{ background: 'linear-gradient(to left, #F59E0B, #D97706)' }}>
          <Plus size={16} /> فاتورة جديدة
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
            <FileText size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-lg font-black text-amber-700">{invoices.length}</p>
            <p className="text-xs text-gray-500">عدد الفواتير</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
            <DollarSign size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-black text-blue-700">{formatCurrency(totalAmount)}</p>
            <p className="text-xs text-gray-500">إجمالي القيمة</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
            <AlertCircle size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-lg font-black text-red-700">{formatCurrency(totalOpen)}</p>
            <p className="text-xs text-gray-500">المتبقي</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث برقم الفاتورة أو العميل..." className="w-full pr-9 pl-3 py-2.5 bg-white border-2 rounded-xl text-sm outline-none focus:border-amber-400" />
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white" style={{ background: 'linear-gradient(to left, #F59E0B, #D97706)' }}>
              <th className="py-3 px-4 text-right text-xs font-bold">الفاتورة</th>
              <th className="py-3 px-4 text-right text-xs font-bold">التاريخ</th>
              <th className="py-3 px-4 text-right text-xs font-bold">العميل</th>
              <th className="py-3 px-4 text-right text-xs font-bold">الأصناف</th>
              <th className="py-3 px-4 text-right text-xs font-bold">الإجمالي</th>
              <th className="py-3 px-4 text-right text-xs font-bold">المدفوع</th>
              <th className="py-3 px-4 text-right text-xs font-bold">المتبقي</th>
              <th className="py-3 px-4 text-right text-xs font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-20 text-gray-400">⏳</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-20">
                <FileText size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-400">لا توجد فواتير مفتوحة</p>
              </td></tr>
            ) : filtered.map((inv: any) => (
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

      {showNew && <NewOpenInvoiceModal onClose={() => setShowNew(false)} onCreated={(id: string) => { refresh(); setSelectedId(id) }} />}
      {selectedId && <OpenInvoiceDetailModal saleId={selectedId} onClose={() => setSelectedId(null)} onChange={refresh} />}
    </div>
  )
}
