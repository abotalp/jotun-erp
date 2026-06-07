import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { db } from '@/lib/supabase'
import { createStandalonePayment } from '@/hooks/useOpenInvoices'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Plus, Search, X, ArrowDownCircle, ArrowUpCircle,
  Wallet, Receipt, User, FileText
} from 'lucide-react'

export default function PaymentsPage() {
  const { user } = useAppStore()
  const [showAdd, setShowAdd] = useState(false)
  const [direction, setDirection] = useState<'in' | 'out'>('in')
  const [payments, setPayments] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    db.from('customer_payments')
      .select(`*, customer:customers(id, name, customer_type, code)`)
      .order('date', { ascending: false })
      .limit(200)
      .then(({ data }: any) => setPayments(data ?? []))
  }, [refreshKey])

  const filtered = payments.filter((p: any) => {
    if (!search) return true
    const term = search.toLowerCase()
    return p.customer?.name?.toLowerCase().includes(term) ||
           p.payment_no?.toLowerCase().includes(term)
  })

  const totalIn = payments.filter((p: any) => p.direction === 'in').reduce((s, p) => s + (p.amount ?? 0), 0)
  const totalOut = payments.filter((p: any) => p.direction === 'out').reduce((s, p) => s + (p.amount ?? 0), 0)

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">💸 المدفوعات والسندات</h1>
          <p className="text-sm text-gray-500 mt-0.5">{payments.length} سند</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setDirection('in'); setShowAdd(true) }} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg hover:opacity-90">
            <ArrowDownCircle size={16} /> سند قبض
          </button>
          <button onClick={() => { setDirection('out'); setShowAdd(true) }} className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg hover:opacity-90">
            <ArrowUpCircle size={16} /> سند صرف
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
            <ArrowDownCircle size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-lg font-black text-green-700">{formatCurrency(totalIn)}</p>
            <p className="text-xs text-gray-500">إجمالي القبض</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
            <ArrowUpCircle size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-lg font-black text-red-700">{formatCurrency(totalOut)}</p>
            <p className="text-xs text-gray-500">إجمالي الصرف</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
            <Wallet size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-black text-blue-700">{formatCurrency(totalIn - totalOut)}</p>
            <p className="text-xs text-gray-500">الصافي</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث برقم السند أو العميل..."
          className="w-full pr-9 pl-3 py-2.5 bg-white border-2 rounded-xl text-sm outline-none focus:border-blue-400" />
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white" style={{ background: 'linear-gradient(to left, #1B2E4B, #1B3A6B)' }}>
              <th className="py-3 px-4 text-right text-xs font-bold">رقم السند</th>
              <th className="py-3 px-4 text-right text-xs font-bold">التاريخ</th>
              <th className="py-3 px-4 text-right text-xs font-bold">العميل/الموزع</th>
              <th className="py-3 px-4 text-right text-xs font-bold">النوع</th>
              <th className="py-3 px-4 text-right text-xs font-bold">المبلغ</th>
              <th className="py-3 px-4 text-right text-xs font-bold">الدفع</th>
              <th className="py-3 px-4 text-right text-xs font-bold">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                <Receipt size={32} className="mx-auto mb-2 text-gray-300" />
                <p>لا توجد سندات</p>
              </td></tr>
            ) : filtered.map((p: any) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-blue-50/20">
                <td className="py-3 px-4 font-mono text-xs font-bold" style={{ color: '#1B3A6B' }}>{p.payment_no}</td>
                <td className="py-3 px-4 text-xs text-gray-500">{formatDate(p.date)}</td>
                <td className="py-3 px-4 text-xs font-bold">{p.customer?.name ?? '-'}</td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${p.direction === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.direction === 'in' ? '↓ قبض' : '↑ صرف'}
                  </span>
                </td>
                <td className={`py-3 px-4 text-sm font-black ${p.direction === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                  {p.direction === 'in' ? '+' : '-'}{formatCurrency(p.amount)}
                </td>
                <td className="py-3 px-4 text-xs text-gray-500">{p.payment_method === 'cash' ? 'نقدي' : p.payment_method}</td>
                <td className="py-3 px-4 text-xs text-gray-500">{p.notes ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddPaymentModal
          direction={direction}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setRefreshKey(k => k + 1); setShowAdd(false) }}
        />
      )}
    </div>
  )
}

function AddPaymentModal({ direction, onClose, onSaved }: any) {
  const { user } = useAppStore()
  const [customers, setCustomers] = useState<any[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [amount, setAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let q = db.customers().select('id, code, name, customer_type, current_balance, phone').eq('is_active', true).order('name').limit(30)
    if (customerSearch.length >= 1) q = q.or(`name.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%`)
    q.then(({ data }) => setCustomers(data ?? []))
  }, [customerSearch])

  async function handleSave() {
    if (!selectedCustomer) { alert('اختر العميل/الموزع'); return }
    if (amount <= 0) { alert('أدخل مبلغ صحيح'); return }

    setSaving(true)
    const r = await createStandalonePayment({
      customerId: selectedCustomer.id,
      amount,
      direction,
      paymentMethod,
      notes,
      userId: user?.id
    })
    setSaving(false)

    if (r.success) {
      alert(`✅ تم تسجيل ${direction === 'in' ? 'سند القبض' : 'سند الصرف'}: ${r.paymentNo}`)
      onSaved()
    } else alert(`❌ ${r.error}`)
  }

  const titleColor = direction === 'in' ? 'text-green-700' : 'text-red-700'
  const buttonColor = direction === 'in' ? 'bg-green-600' : 'bg-red-500'
  const icon = direction === 'in' ? '⬇️' : '⬆️'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} dir="rtl">
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className={`text-lg font-black ${titleColor}`}>
            {icon} {direction === 'in' ? 'سند قبض من عميل' : 'سند صرف لعميل/موزع'}
          </h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* اختيار العميل */}
          <div>
            <label className="block text-sm font-bold mb-2">العميل/الموزع *</label>
            {selectedCustomer ? (
              <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold">{selectedCustomer.name}</p>
                  <p className="text-xs text-gray-500">
                    {selectedCustomer.code} | الرصيد: <span className={selectedCustomer.current_balance > 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatCurrency(Math.abs(selectedCustomer.current_balance))}
                      {selectedCustomer.current_balance > 0 ? ' (مديونية)' : selectedCustomer.current_balance < 0 ? ' (رصيد)' : ''}
                    </span>
                  </p>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="text-red-500"><X size={18} /></button>
              </div>
            ) : (
              <>
                <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="🔍 ابحث عن العميل..." className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-blue-400" />
                {customers.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-xl">
                    {customers.map((c: any) => (
                      <button key={c.id} onClick={() => setSelectedCustomer(c)} className="w-full p-2 hover:bg-blue-50 text-right border-b last:border-0">
                        <p className="text-sm font-bold">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.code} | {c.phone ?? '-'}</p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1">المبلغ *</label>
              <input type="number" value={amount || ''} onChange={e => setAmount(+e.target.value || 0)} className="w-full px-3 py-3 border-2 rounded-xl text-2xl font-black text-center outline-none focus:border-amber-400" autoFocus />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">طريقة الدفع</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm bg-white outline-none mt-3">
                <option value="cash">نقدي</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="check">شيك</option>
                <option value="visa">فيزا</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">ملاحظات</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-blue-400" />
          </div>
        </div>

        <div className="p-5 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 rounded-xl font-bold hover:bg-gray-50">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className={`flex-1 py-2.5 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 ${buttonColor}`}>
            {saving ? '⏳' : `${icon} حفظ`}
          </button>
        </div>
      </div>
    </div>
  )
}