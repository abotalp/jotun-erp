import React, { useState } from 'react'
import { useSuppliersList, useSupplierTransactions, createSupplier, deleteSupplier } from '@/hooks/useSuppliers'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search, X, Trash2, Phone, Mail, Truck } from 'lucide-react'
import type { Supplier } from '@/types/database'

function AddModal({ onClose, onSaved }: any) {
  const [form, setForm] = useState({
    name: '', contact_person: '', phone: '', email: '',
    address: '', tax_number: '', payment_terms: 'cash'
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave() {
    if (!form.name) { alert('الاسم مطلوب'); return }
    setSaving(true)
    const r = await createSupplier(form)
    setSaving(false)
    if (r.success) { onSaved(); onClose() } else alert(r.error)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-black">➕ مورد جديد</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          {[
            { k: 'name', l: 'اسم المورد *' },
            { k: 'contact_person', l: 'مسؤول التواصل' },
            { k: 'phone', l: 'الهاتف', type: 'tel' },
            { k: 'email', l: 'البريد الإلكتروني', type: 'email' },
            { k: 'address', l: 'العنوان' },
            { k: 'tax_number', l: 'الرقم الضريبي' },
          ].map(f => (
            <div key={f.k}>
              <label className="block text-sm font-bold mb-1">{f.l}</label>
              <input type={f.type ?? 'text'} value={(form as any)[f.k]} onChange={e => set(f.k, e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-bold mb-1">شروط الدفع</label>
            <select value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white outline-none">
              <option value="cash">فوري</option>
              <option value="30days">30 يوم</option>
              <option value="60days">60 يوم</option>
              <option value="90days">90 يوم</option>
            </select>
          </div>
        </div>
        <div className="p-5 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 rounded-xl font-bold hover:bg-gray-50">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 text-white font-bold rounded-xl"
            style={{ background: 'linear-gradient(to left, #1B3A6B, #1B2E4B)' }}>
            {saving ? '⏳' : 'إضافة'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SuppliersPage() {
  const [search, setSearch]   = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<Supplier | null>(null)
  const { data, loading, refresh } = useSuppliersList(search)
  const transactions = useSupplierTransactions(selected?.id ?? null)

  const totalDue = data.reduce((s, sup) => s + sup.current_balance, 0)

  async function handleDelete(s: Supplier) {
    if (!confirm(`حذف ${s.name}؟`)) return
    await deleteSupplier(s.id)
    refresh()
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">🚚 الموردون</h1>
          <p className="text-sm text-gray-500">
            {data.length} مورد | إجمالي المستحق: <span className="text-red-500 font-bold">{formatCurrency(totalDue)}</span>
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-bold shadow-lg hover:opacity-90"
          style={{ background: 'linear-gradient(to left, #1B3A6B, #1B2E4B)' }}>
          <Plus size={16} /> مورد جديد
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
          className="w-full pr-9 pl-3 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? <div className="col-span-full text-center py-20 text-gray-400">⏳</div> :
          data.length === 0 ? <div className="col-span-full text-center py-20 text-gray-400"><Truck size={32} className="mx-auto mb-2" /><p>لا يوجد موردون</p></div> :
          data.map(s => (
            <div key={s.id} onClick={() => setSelected(selected?.id === s.id ? null : s)}
              className={`bg-white rounded-2xl border p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id === s.id ? 'border-amber-400 ring-2 ring-amber-100' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ background: 'linear-gradient(135deg, #1B2E4B, #1B3A6B)' }}>
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black">{s.name}</p>
                  {s.contact_person && <p className="text-xs text-gray-500">{s.contact_person}</p>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(s) }} className="text-red-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="space-y-1 text-xs text-gray-500 mb-3">
                {s.phone && <div className="flex items-center gap-1.5"><Phone size={11} /> {s.phone}</div>}
                {s.email && <div className="flex items-center gap-1.5"><Mail size={11} /> {s.email}</div>}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                <span className="text-xs text-gray-400">{s.payment_terms}</span>
                {s.current_balance !== 0 && (
                  <span className={`text-xs font-black ${s.current_balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {s.current_balance > 0 ? 'مستحق: ' : 'رصيد: '}{formatCurrency(Math.abs(s.current_balance))}
                  </span>
                )}
              </div>
            </div>
          ))
        }
      </div>

      {selected && transactions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="text-sm font-black mb-3">كشف حساب: {selected.name}</h3>
          <div className="space-y-2">
            {transactions.map((t: any) => (
              <div key={t.id} className="flex justify-between bg-gray-50 rounded-xl p-3 text-xs">
                <div>
                  <p className="font-bold">{t.reference_no ?? t.type}</p>
                  <p className="text-gray-400">{formatDate(t.date)}</p>
                </div>
                <div className="text-left">
                  <p className={`font-black ${t.amount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {t.amount > 0 ? '+' : ''}{formatCurrency(t.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSaved={refresh} />}
    </div>
  )
}