import React, { useState } from 'react'
import { useCashSummary, useExpenses, useRevenues, useExpenseCategories, addExpense, addRevenue } from '@/hooks/useAccounting'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, X, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

export default function AccountingPage() {
  const { user } = useAppStore()
  const [tab, setTab] = useState<'cash'|'expenses'|'revenues'>('cash')
  const [showExpense, setShowExpense] = useState(false)
  const [showRevenue, setShowRevenue] = useState(false)

  const { data: cash, refresh: refreshCash }   = useCashSummary()
  const { data: expenses, refresh: refreshExp } = useExpenses()
  const { data: revenues, refresh: refreshRev } = useRevenues()
  const categories = useExpenseCategories()

  const totalCash = cash.registers.reduce((s: number, r: any) => s + r.current_balance, 0)
  const totalExp  = expenses.reduce((s: number, e: any) => s + e.amount, 0)
  const totalRev  = revenues.reduce((s: number, r: any) => s + r.amount, 0)

  const [expForm, setExpForm] = useState({ category_id: '', description: '', amount: 0, date: new Date().toISOString().slice(0,10), payment_method: 'cash' })
  const [revForm, setRevForm] = useState({ source: '', description: '', amount: 0, date: new Date().toISOString().slice(0,10) })

  async function handleAddExpense() {
    if (!expForm.description || !expForm.amount) { alert('املأ كل البيانات'); return }
    const r = await addExpense(expForm, user?.id)
    if (r.success) { refreshExp(); refreshCash(); setShowExpense(false); setExpForm({ category_id: '', description: '', amount: 0, date: new Date().toISOString().slice(0,10), payment_method: 'cash' }) }
    else alert(r.error)
  }

  async function handleAddRevenue() {
    if (!revForm.source || !revForm.amount) { alert('املأ كل البيانات'); return }
    const r = await addRevenue(revForm, user?.id)
    if (r.success) { refreshRev(); refreshCash(); setShowRevenue(false); setRevForm({ source: '', description: '', amount: 0, date: new Date().toISOString().slice(0,10) }) }
    else alert(r.error)
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">💰 الحسابات والخزينة</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowRevenue(true)} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:opacity-90">
            <Plus size={15} /> إيراد
          </button>
          <button onClick={() => setShowExpense(true)} className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:opacity-90">
            <Plus size={15} /> مصروف
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'رصيد الخزينة', value: totalCash, icon: Wallet, color: '#1B3A6B' },
          { label: 'إجمالي الإيرادات', value: totalRev, icon: TrendingUp, color: '#10B981' },
          { label: 'إجمالي المصروفات', value: totalExp, icon: TrendingDown, color: '#EF4444' },
          { label: 'صافي', value: totalRev - totalExp, icon: DollarSign, color: (totalRev - totalExp) >= 0 ? '#10B981' : '#EF4444' }
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: k.color }}>
              <k.icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-black">{formatCurrency(k.value)}</p>
              <p className="text-xs text-gray-500">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex bg-white rounded-2xl border border-gray-100 p-1 gap-1">
        {[
          { v: 'cash', l: '💵 الخزينة' },
          { v: 'expenses', l: '📤 المصروفات' },
          { v: 'revenues', l: '📥 الإيرادات' }
        ].map(t => (
          <button key={t.v} onClick={() => setTab(t.v as any)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold ${tab === t.v ? 'text-white shadow' : 'text-gray-600'}`}
            style={tab === t.v ? { backgroundColor: '#1B3A6B' } : {}}>{t.l}</button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {tab === 'cash' && (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b">{['التاريخ','النوع','المصدر','المبلغ','الرصيد','الوصف'].map(h => <th key={h} className="py-3 px-4 text-right text-xs font-bold text-gray-600">{h}</th>)}</tr></thead>
            <tbody>
              {cash.movements.map((m: any) => (
                <tr key={m.id} className="border-b border-gray-50">
                  <td className="py-2.5 px-4 text-xs text-gray-400">{formatDate(m.date)}</td>
                  <td className="py-2.5 px-4"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${m.movement_type === 'in' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{m.movement_type === 'in' ? '↓ وارد' : '↑ صادر'}</span></td>
                  <td className="py-2.5 px-4 text-xs text-gray-500">{m.source}</td>
                  <td className={`py-2.5 px-4 text-xs font-black ${m.movement_type === 'in' ? 'text-green-600' : 'text-red-600'}`}>{m.movement_type === 'in' ? '+' : '-'}{formatCurrency(m.amount)}</td>
                  <td className="py-2.5 px-4 text-xs font-bold">{formatCurrency(m.balance_after ?? 0)}</td>
                  <td className="py-2.5 px-4 text-xs text-gray-500">{m.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === 'expenses' && (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b">{['التاريخ','الوصف','التصنيف','المبلغ'].map(h => <th key={h} className="py-3 px-4 text-right text-xs font-bold text-gray-600">{h}</th>)}</tr></thead>
            <tbody>
              {expenses.map((e: any) => (
                <tr key={e.id} className="border-b border-gray-50">
                  <td className="py-2.5 px-4 text-xs text-gray-400">{formatDate(e.date)}</td>
                  <td className="py-2.5 px-4 text-xs font-bold">{e.description}</td>
                  <td className="py-2.5 px-4 text-xs text-gray-500">{e.category?.name ?? '-'}</td>
                  <td className="py-2.5 px-4 text-xs font-black text-red-600">{formatCurrency(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === 'revenues' && (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b">{['التاريخ','المصدر','الوصف','المبلغ'].map(h => <th key={h} className="py-3 px-4 text-right text-xs font-bold text-gray-600">{h}</th>)}</tr></thead>
            <tbody>
              {revenues.map((r: any) => (
                <tr key={r.id} className="border-b border-gray-50">
                  <td className="py-2.5 px-4 text-xs text-gray-400">{formatDate(r.date)}</td>
                  <td className="py-2.5 px-4 text-xs font-bold">{r.source}</td>
                  <td className="py-2.5 px-4 text-xs text-gray-500">{r.description}</td>
                  <td className="py-2.5 px-4 text-xs font-black text-green-600">{formatCurrency(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowExpense(false)} dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h3 className="text-lg font-black text-red-600">📤 تسجيل مصروف</h3><button onClick={() => setShowExpense(false)}><X size={20} /></button></div>
            <div className="space-y-3">
              <div><label className="block text-sm font-bold mb-1">التصنيف</label>
                <select value={expForm.category_id} onChange={e => setExpForm(p => ({ ...p, category_id: e.target.value }))} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm bg-white">
                  <option value="">اختر</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-bold mb-1">الوصف *</label><input value={expForm.description} onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-bold mb-1">المبلغ</label><input type="number" value={expForm.amount || ''} onChange={e => setExpForm(p => ({ ...p, amount: +e.target.value || 0 }))} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm" /></div>
                <div><label className="block text-sm font-bold mb-1">التاريخ</label><input type="date" value={expForm.date} onChange={e => setExpForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm" /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowExpense(false)} className="flex-1 py-2.5 border-2 rounded-xl font-bold">إلغاء</button>
              <button onClick={handleAddExpense} className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl">حفظ</button>
            </div>
          </div>
        </div>
      )}

      {showRevenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowRevenue(false)} dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h3 className="text-lg font-black text-green-600">📥 تسجيل إيراد</h3><button onClick={() => setShowRevenue(false)}><X size={20} /></button></div>
            <div className="space-y-3">
              <div><label className="block text-sm font-bold mb-1">المصدر *</label><input value={revForm.source} onChange={e => setRevForm(p => ({ ...p, source: e.target.value }))} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm" /></div>
              <div><label className="block text-sm font-bold mb-1">الوصف</label><input value={revForm.description} onChange={e => setRevForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-bold mb-1">المبلغ</label><input type="number" value={revForm.amount || ''} onChange={e => setRevForm(p => ({ ...p, amount: +e.target.value || 0 }))} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm" /></div>
                <div><label className="block text-sm font-bold mb-1">التاريخ</label><input type="date" value={revForm.date} onChange={e => setRevForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm" /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowRevenue(false)} className="flex-1 py-2.5 border-2 rounded-xl font-bold">إلغاء</button>
              <button onClick={handleAddRevenue} className="flex-1 py-2.5 bg-green-600 text-white font-bold rounded-xl">حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}