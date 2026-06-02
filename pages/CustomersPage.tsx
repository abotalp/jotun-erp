import React, { useState } from 'react'
import {
  useCustomersList,
  useCustomerTransactions,
  useCustomerColorHistory,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from '@/hooks/useCustomersManagement'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Plus, Search, Edit2, Trash2, X, Phone, MapPin,
  Users, FileText, History, Palette
} from 'lucide-react'
import type { Customer } from '@/types/database'

const TYPE_LABELS: Record<string, string> = {
  retail:     'عادي',
  wholesale:  'جملة',
  contractor: 'مقاول',
  engineer:   'مهندس',
  company:    'شركة',
  vip:        'VIP'
}

const TYPE_COLORS: Record<string, string> = {
  retail:     'bg-gray-100 text-gray-700',
  wholesale:  'bg-blue-100 text-blue-700',
  contractor: 'bg-orange-100 text-orange-700',
  engineer:   'bg-purple-100 text-purple-700',
  company:    'bg-indigo-100 text-indigo-700',
  vip:        'bg-yellow-100 text-yellow-700'
}

// ─── Add/Edit Customer Modal ───────────────────────────────
function CustomerModal({
  customer, onClose, onSaved
}: {
  customer?: Customer | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName]               = useState(customer?.name ?? '')
  const [phone, setPhone]             = useState(customer?.phone ?? '')
  const [mobile, setMobile]           = useState(customer?.mobile ?? '')
  const [email, setEmail]             = useState(customer?.email ?? '')
  const [address, setAddress]         = useState(customer?.address ?? '')
  const [city, setCity]               = useState(customer?.city ?? '')
  const [customerType, setCustomerType] = useState(customer?.customer_type ?? 'retail')
  const [creditLimit, setCreditLimit] = useState(customer?.credit_limit ?? 0)
  const [defaultDiscount, setDefaultDiscount] = useState(customer?.default_discount ?? 0)
  const [notes, setNotes]             = useState(customer?.notes ?? '')
  const [saving, setSaving]           = useState(false)

  async function handleSave() {
    if (!name.trim()) {
      alert('الاسم مطلوب')
      return
    }
    setSaving(true)

    const payload: any = {
      name: name.trim(),
      phone: phone.trim() || null,
      mobile: mobile.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      customer_type: customerType,
      credit_limit: creditLimit,
      default_discount: defaultDiscount,
      notes: notes.trim() || null
    }

    const result = customer
      ? await updateCustomer(customer.id, payload)
      : await createCustomer(payload)

    setSaving(false)

    if (result.success) {
      onSaved()
      onClose()
    } else {
      alert(`خطأ: ${result.error}`)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
      dir="rtl"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-black text-gray-900">
            {customer ? '✏️ تعديل عميل' : '➕ عميل جديد'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">الاسم *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">نوع العميل</label>
            <select
              value={customerType}
              onChange={e => setCustomerType(e.target.value as any)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none bg-white focus:border-blue-400"
            >
              {Object.entries(TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">الهاتف</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                type="tel"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">المحمول</label>
              <input
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                type="tel"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">البريد الإلكتروني</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">العنوان</label>
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">المدينة</label>
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">حد الائتمان</label>
              <input
                type="number"
                value={creditLimit || ''}
                onChange={e => setCreditLimit(+e.target.value || 0)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">خصم افتراضي %</label>
              <input
                type="number"
                value={defaultDiscount || ''}
                onChange={e => setDefaultDiscount(+e.target.value || 0)}
                min={0}
                max={100}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">ملاحظات</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(to left, #1B3A6B, #1B2E4B)' }}
          >
            {saving ? '⏳ جاري الحفظ...' : customer ? 'حفظ' : 'إضافة'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Customer Details Drawer ──────────────────────────────
function CustomerDetailDrawer({
  customer, onClose
}: {
  customer: Customer
  onClose: () => void
}) {
  const [tab, setTab] = useState<'account' | 'colors'>('account')
  const { data: transactions } = useCustomerTransactions(customer.id)
  const { data: colorHistory } = useCustomerColorHistory(customer.id)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
      dir="rtl"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div
          className="text-white p-5 rounded-t-3xl"
          style={{ background: 'linear-gradient(to left, #1B2E4B, #1B3A6B)' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black"
                style={{ backgroundColor: '#D4AF37' }}
              >
                {customer.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-black">{customer.name}</h3>
                <p className="text-blue-300 text-sm">
                  {customer.phone ?? customer.mobile ?? '-'}
                </p>
                <p className="text-[10px] text-blue-200 mt-1">
                  {customer.code} | {TYPE_LABELS[customer.customer_type]}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-base font-black">{formatCurrency(customer.total_purchases)}</p>
              <p className="text-[10px] text-blue-300">إجمالي الشراء</p>
            </div>
            <div
              className={`rounded-xl p-3 text-center ${customer.current_balance > 0 ? 'bg-red-500/30' : 'bg-green-500/20'}`}
            >
              <p className="text-base font-black">{formatCurrency(Math.abs(customer.current_balance))}</p>
              <p className="text-[10px] text-blue-300">
                {customer.current_balance > 0 ? 'مديونية' : customer.current_balance < 0 ? 'رصيد' : 'مسدد'}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-base font-black">{formatCurrency(customer.credit_limit)}</p>
              <p className="text-[10px] text-blue-300">حد الائتمان</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab('account')}
            className={`flex-1 py-3 text-sm font-bold transition-all ${
              tab === 'account' ? 'border-b-2 text-amber-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            style={tab === 'account' ? { borderColor: '#D4AF37' } : {}}
          >
            <FileText size={14} className="inline ml-1" />
            كشف الحساب
          </button>
          <button
            onClick={() => setTab('colors')}
            className={`flex-1 py-3 text-sm font-bold transition-all ${
              tab === 'colors' ? 'border-b-2 text-amber-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            style={tab === 'colors' ? { borderColor: '#D4AF37' } : {}}
          >
            <Palette size={14} className="inline ml-1" />
            سجل الألوان
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'account' && (
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <History size={24} className="mx-auto mb-2" />
                  <p className="text-sm">لا توجد حركات</p>
                </div>
              ) : transactions.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div>
                    <p className="text-xs font-bold text-gray-800">
                      {t.reference_no ?? t.type}
                    </p>
                    <p className="text-[10px] text-gray-400">{formatDate(t.date)}</p>
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-black ${t.amount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {t.amount > 0 ? '+' : ''}{formatCurrency(t.amount)}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      الرصيد: {formatCurrency(t.balance_after ?? 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'colors' && (
            <div className="space-y-2">
              {colorHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-3xl mb-2">🎨</p>
                  <p className="text-sm">لا يوجد سجل ألوان</p>
                  <p className="text-[11px] mt-1">
                    سيتم حفظ كل لون يطلبه العميل هنا
                  </p>
                </div>
              ) : colorHistory.map((h: any) => (
                <div key={h.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <div
                    className="w-10 h-10 rounded-xl border-2 border-white shadow flex-shrink-0"
                    style={{ backgroundColor: h.color?.hex_value ?? '#ccc' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-gray-800">
                      {h.color?.color_code} - {h.color?.color_name_ar ?? h.color?.color_name}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {h.variant?.product?.name} | {h.variant?.size_name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {formatDate(h.created_at)}
                      {h.room_description && ` | ${h.room_description}`}
                    </p>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className="text-xs font-bold text-gray-700">{h.quantity_sold} وحدة</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────
export default function CustomersPage() {
  const [search, setSearch]               = useState('')
  const [typeFilter, setTypeFilter]       = useState('')
  const [showAddModal, setShowAddModal]   = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null)

  const { data: customers, loading, refresh } = useCustomersList(search, typeFilter)

  async function handleDelete(c: Customer) {
    if (!confirm(`حذف "${c.name}"؟`)) return
    const r = await deleteCustomer(c.id)
    if (r.success) refresh()
    else alert(`خطأ: ${r.error}`)
  }

  const totalBalance = customers.reduce((s, c) => s + c.current_balance, 0)

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">👥 إدارة العملاء</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {customers.length} عميل
            {totalBalance !== 0 && (
              <span className={`font-bold mr-2 ${totalBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                | {totalBalance > 0 ? 'إجمالي مديونية' : 'إجمالي رصيد'}: {formatCurrency(Math.abs(totalBalance))}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-bold shadow-lg hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(to left, #1B3A6B, #1B2E4B)' }}
        >
          <Plus size={16} /> عميل جديد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الهاتف..."
            className="w-full pr-9 pl-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-gray-50"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              !typeFilter ? 'text-white' : 'bg-gray-100 text-gray-600'
            }`}
            style={!typeFilter ? { backgroundColor: '#1B3A6B' } : {}}
          >
            الكل
          </button>
          {Object.entries(TYPE_LABELS).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setTypeFilter(typeFilter === v ? '' : v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                typeFilter === v ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={typeFilter === v ? { backgroundColor: '#1B3A6B' } : {}}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">⏳ جاري التحميل...</div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <Users size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400 text-sm">لا يوجد عملاء</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {customers.map(c => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-400 hover:shadow-md transition-all"
            >
              <div
                className="flex items-start gap-3 mb-3 cursor-pointer"
                onClick={() => setViewingCustomer(c)}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1B2E4B, #1B3A6B)' }}
                >
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{c.name}</p>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${TYPE_COLORS[c.customer_type] ?? 'bg-gray-100'}`}
                  >
                    {TYPE_LABELS[c.customer_type]}
                  </span>
                </div>
              </div>

              <div className="space-y-1 mb-3">
                {(c.phone || c.mobile) && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Phone size={11} /> {c.phone ?? c.mobile}
                  </div>
                )}
                {c.address && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin size={11} /> <span className="truncate">{c.address}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                <div className="text-xs">
                  <p className="text-gray-400">إجمالي</p>
                  <p className="font-bold text-gray-700">{formatCurrency(c.total_purchases)}</p>
                </div>
                {c.current_balance !== 0 && (
                  <div className="text-xs text-left">
                    <p className="text-gray-400">
                      {c.current_balance > 0 ? 'مديونية' : 'رصيد'}
                    </p>
                    <p
                      className={`font-black ${c.current_balance > 0 ? 'text-red-500' : 'text-green-500'}`}
                    >
                      {formatCurrency(Math.abs(c.current_balance))}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-1 mt-3 pt-2 border-t border-gray-50">
                <button
                  onClick={() => setViewingCustomer(c)}
                  className="flex-1 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100"
                >
                  📊 تفاصيل
                </button>
                <button
                  onClick={() => setEditingCustomer(c)}
                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {(showAddModal || editingCustomer) && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => { setShowAddModal(false); setEditingCustomer(null) }}
          onSaved={refresh}
        />
      )}

      {viewingCustomer && (
        <CustomerDetailDrawer
          customer={viewingCustomer}
          onClose={() => setViewingCustomer(null)}
        />
      )}
    </div>
  )
}