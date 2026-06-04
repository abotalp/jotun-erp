import React, { useState } from 'react'
import { useCashSummary, useExpenses, useRevenues, useExpenseCategories, addExpense, addRevenue, cashAdjustment } from '@/hooks/useAccounting'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, X, Wallet, TrendingUp, TrendingDown, DollarSign, Search, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

export default function AccountingPage() {
  const { user } = useAppStore()
  const [tab, setTab] = useState<'cash' | 'expenses' | 'revenues'>('cash')
  const [showExpense, setShowExpense] = useState(false)
  const [showRevenue, setShowRevenue] = useState(false)
  const [showCashIn, setShowCashIn] = useState(false)
  const [showCashOut, setShowCashOut] = useState(false)
  const [search, setSearch] = useState('')

  const { data: cash, refresh: refreshCash } = useCashSummary()
  const { data: expenses, refresh: refreshExp } = useExpenses()
  const { data: revenues, refresh: refreshRev } = useRevenues()
  const categories = useExpenseCategories()

  const totalCash = cash.registers.reduce((s: number, r: any) => s + r.current_balance, 0)
  const totalExp = expenses.reduce((s: number, e: any) => s + e.amount, 0)
  const totalRev = revenues.reduce((s: number, r: any) => s + r.amount, 0)

  const [expForm, setExpForm] = useState({ category_id: '', description: '', amount: 0, date: new Date().toISOString().slice(0, 10), payment_method: 'cash' })
  const [revForm, setRevForm] = useState({ source: '', description: '', amount: 0, date: new Date().toISOString().slice(0, 10) })
  const [cashForm, setCashForm] = useState({ amount: 0, description: '' })

  async function handleAddExpense() {
    if (!expForm.description || !expForm.amount || !expForm.category_id) { alert('املأ كل البيانات'); return }
    const r = await addExpense(expForm, user?.id)
    if (r.success) {
      refreshExp(); refreshCash(); setShowExpense(false)
      setExpForm({ category_id: '', description: '', amount: 0, date: new Date().toISOString().slice(0, 10), payment_method: 'cash' })
    } else alert(r.error)
  }

  async function handleAddRevenue() {
    if (!revForm.source || !revForm.amount) { alert('املأ كل البيانات'); return }
    const r = await addRevenue(revForm, user?.id)
    if (r.success) {
      refreshRev(); refreshCash(); setShowRevenue(false)
      setRevForm({ source: '', description: '', amount: 0, date: new Date().toISOString().slice(0, 10) })
    } else alert(r.error)
  }

  async function handleCashAdjustment(type: 'in' | 'out') {
    if (!cashForm.amount || !cashForm.description) { alert('املأ كل البيانات'); return }
    const r = await cashAdjustment(type, cashForm.amount, cashForm.description, user?.id)
    if (r.success) {
      refreshCash()
      setShowCashIn(false)
      setShowCashOut(false)
      setCashForm({ amount: 0, description: '' })
      alert(`✅ تم! الرصيد الجديد: ${formatCurrency(r.newBalance!)}`)
    } else alert(r.error)
  }

  const filteredExpenses = expenses.filter((e: any) => {
    if (!search) return true
    const term = search.toLowerCase()
    return e.description?.toLowerCase().includes(term) || e.category?.name?.toLowerCase().includes(term)
  })

  const expensesByCategory: Record<string, number> = {}
  expenses.forEach((e: any) => {
    const cat = e.category?.name ?? 'غير مصنف'
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + e.amount
  })

  return (
    <div className="space-y-4" dir="rtl">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">💰 الحسابات والخزينة</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowCashIn(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-lg">
            <ArrowDownCircle size={15} /> إيداع للخزينة
          </button>
          <button onClick={() => setShowCashOut(true)} className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-lg">
            <ArrowUpCircle size={15} /> سحب من الخزينة
          </button>
          <button onClick={() => setShowRevenue(true)} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-lg">
            <Plus size={15} /> إيراد
          </button>
          <button onClick={() => setShowExpense(true)} className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-lg">
            <Plus size={15} /> مصروف
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'رصيد الخزينة', value: totalCash, icon: Wallet, color: '#1B3A6B' },
          { label: 'إجمالي الإيرادات', value: totalRev, icon: TrendingUp, color: '#10B981' },
          { label: 'إجمالي المصروفات', value: totalExp, icon: TrendingDown, color: '#EF4444' },
          { label: 'صافي', value: totalRev - totalExp, icon: DollarSign, color: (totalRev - totalExp) >= 0 ? '#10B981' : '#EF4444' }
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: k.color }}>
              <k.icon size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black truncate">{formatCurrency(k.value)}</p>
              <p className="text-xs text-gray-500">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Categories Stats */}
      {tab === 'expenses' && Object.keys(expensesByCategory).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="text-sm font-black text-gray-800 mb-3">📊 توزيع المصروفات</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
              <div key={cat} className="bg-red-50 rounded-xl p-3">
                <p className="text-xs text-gray-600">{cat}</p>
                <p className="text-base font-black text-red-600">{formatCurrency(amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex bg-white rounded-2xl border border-gray-100 p-1 gap-1">
        {[{ v: 'cash', l: '💵 حركات الخزينة' }, { v: 'expenses', l: '📤 المصروفات' }, { v: 'revenues', l: '📥 الإيرادات' }].map(t => (
          <button key={t.v} onClick={() => setTab(t.v as any)} className={`flex-1 py-2 rounded-xl text-xs font-bold ${tab === t.v ? 'text-white shadow' : 'text-gray-600'}`} style={tab === t.v ? { backgroundColor: '#1B3A6B' } : {}}>
            {t.l}
          </button>
        ))}
      </div>

      {(tab === 'expenses' || tab === 'revenues') && (
        <div className="relative">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="w-full pr-9 pl-3 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {tab === 'cash' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b">{['التاريخ', 'النوع', 'المصدر', 'المبلغ', 'الرصيد', 'الوصف'].map(h => <th key={h} className="py-3 px-4 text-right text-xs font-bold text-gray-600">{h}</th>)}</tr></thead>
              <tbody>
                {cash.movements.map((m: any) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2.5 px-4 text-xs text-gray-400">{formatDate(m.date)}</td>
                    <td className="py-2.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${m.movement_type === 'in' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {m.movement_type === 'in' ? '↓ وارد' : '↑ صادر'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-gray-500">
                      {m.source === 'sale' ? 'فاتورة بيع' :
                       m.source === 'sale_return' ? 'مرتجع/إلغاء' :
                       m.source === 'expense' ? 'مصروف' :
                       m.source === 'revenue' ? 'إيراد' :
                       m.source === 'adjustment' ? 'تعديل يدوي' :
                       m.source === 'purchase' ? 'شراء' : m.source}
                    </td>
                    <td className={`py-2.5 px-4 text-xs font-black ${m.movement_type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                      {m.movement_type === 'in' ? '+' : '-'}{formatCurrency(m.amount)}
                    </td>
                    <td className="py-2.5 px-4 text-xs font-bold">{formatCurrency(m.balance_after ?? 0)}</td>
                    <td className="py-2.5 px-4 text-xs text-gray-500">{m.description}</td>
                  </tr>
                ))}
                {cash.movements.length === 0 && (<tr><td colSpan={6} className="text-center py-12 text-gray-400">لا توجد حركات</td></tr>)}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b">{['التاريخ', 'الوصف', 'التصنيف', 'المبلغ', 'الدفع'].map(h => <th key={h} className="py-3 px-4 text-right text-xs font-bold text-gray-600">{h}</th>)}</tr></thead>
              <tbody>
                {filteredExpenses.map((e: any) => (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-red-50/30">
                    <td className="py-2.5 px-4 text-xs text-gray-400">{formatDate(e.date)}</td>
                    <td className="py-2.5 px-4 text-xs font-bold">{e.description}</td>
                    <td className="py-2.5 px-4"><span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">{e.category?.icon} {e.category?.name ?? '-'}</span></td>
                    <td className="py-2.5 px-4 text-xs font-black text-red-600">{formatCurrency(e.amount)}</td>
                    <td className="py-2.5 px-4 text-xs text-gray-500">{e.payment_method === 'cash' ? 'نقدي' : e.payment_method}</td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (<tr><td colSpan={5} className="text-center py-12 text-gray-400">لا توجد مصروفات</td></tr>)}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'revenues' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b">{['التاريخ', 'المصدر', 'الوصف', 'المبلغ'].map(h => <th key={h} className="py-3 px-4 text-right text-xs font-bold text-gray-600">{h}</th>)}</tr></thead>
              <tbody>
                {revenues.filter((r: any) => !search || r.source.toLowerCase().includes(search.toLowerCase())).map((r: any) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-green-50/30">
                    <td className="py-2.5 px-4 text-xs text-gray-400">{formatDate(r.date)}</td>
                    <td className="py-2.5 px-4 text-xs font-bold">{r.source}</td>
                    <td className="py-2.5 px-4 text-xs text-gray-500">{r.description}</td>
                    <td className="py-2.5 px-4 text-xs font-black text-green-600">{formatCurrency(r.amount)}</td>
                  </tr>
                ))}
                {revenues.length === 0 && (<tr><td colSpan={4} className="text-center py-12 text-gray-400">لا توجد إيرادات</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cash In Modal */}
      {showCashIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowCashIn(false)} dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-blue-600">⬇️ إيداع للخزينة</h3>
              <button onClick={() => setShowCashIn(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 mb-4 text-xs text-blue-800">
              💡 مثال: رصيد افتتاحي، إضافة رأس مال، إيداع نقدي
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold mb-1">الوصف *</label>
                <input value={cashForm.description} onChange={e => setCashForm(p => ({ ...p, description: e.target.value }))} placeholder="مثال: رصيد افتتاحي / زيادة رأس مال" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">المبلغ *</label>
                <input type="number" value={cashForm.amount || ''} onChange={e => setCashForm(p => ({ ...p, amount: +e.target.value || 0 }))} className="w-full px-3 py-3 border-2 border-blue-200 rounded-xl text-2xl font-black text-center outline-none focus:border-blue-400" autoFocus />
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">الرصيد بعد الإيداع</p>
                <p className="text-xl font-black text-blue-600">{formatCurrency(totalCash + cashForm.amount)}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowCashIn(false)} className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-50">إلغاء</button>
              <button onClick={() => handleCashAdjustment('in')} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:opacity-90">⬇️ إيداع</button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Out Modal */}
      {showCashOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowCashOut(false)} dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-orange-600">⬆️ سحب من الخزينة</h3>
              <button onClick={() => setShowCashOut(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 mb-4 text-xs text-orange-800">
              💡 مثال: سحب شخصي، تحويل لحساب آخر
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold mb-1">الوصف *</label>
                <input value={cashForm.description} onChange={e => setCashForm(p => ({ ...p, description: e.target.value }))} placeholder="مثال: سحب شخصي" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">المبلغ *</label>
                <input type="number" value={cashForm.amount || ''} onChange={e => setCashForm(p => ({ ...p, amount: +e.target.value || 0 }))} className="w-full px-3 py-3 border-2 border-orange-200 rounded-xl text-2xl font-black text-center outline-none focus:border-orange-400" autoFocus />
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">الرصيد بعد السحب</p>
                <p className={`text-xl font-black ${totalCash - cashForm.amount < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                  {formatCurrency(totalCash - cashForm.amount)}
                </p>
                {totalCash - cashForm.amount < 0 && (
                  <p className="text-xs text-red-600 mt-1">⚠️ الرصيد سيصبح سالباً</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowCashOut(false)} className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-50">إلغاء</button>
              <button onClick={() => handleCashAdjustment('out')} disabled={cashForm.amount > totalCash} className="flex-1 py-2.5 bg-orange-600 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50">⬆️ سحب</button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowExpense(false)} dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-black text-red-600">📤 تسجيل مصروف</h3><button onClick={() => setShowExpense(false)}><X size={20} className="text-gray-400" /></button></div>
            <div className="space-y-3">
              <div><label className="block text-sm font-bold mb-1">التصنيف *</label>
                <select value={expForm.category_id} onChange={e => setExpForm(p => ({ ...p, category_id: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-red-400">
                  <option value="">اختر التصنيف</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-bold mb-1">الوصف *</label>
                <input value={expForm.description} onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-red-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-bold mb-1">المبلغ *</label>
                  <input type="number" value={expForm.amount || ''} onChange={e => setExpForm(p => ({ ...p, amount: +e.target.value || 0 }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-red-400" />
                </div>
                <div><label className="block text-sm font-bold mb-1">التاريخ</label>
                  <input type="date" value={expForm.date} onChange={e => setExpForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none" />
                </div>
              </div>
              <div><label className="block text-sm font-bold mb-1">طريقة الدفع</label>
                <select value={expForm.payment_method} onChange={e => setExpForm(p => ({ ...p, payment_method: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white outline-none">
                  <option value="cash">نقدي (يخصم من الخزينة)</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="check">شيك</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowExpense(false)} className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-50">إلغاء</button>
              <button onClick={handleAddExpense} className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:opacity-90">حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Modal */}
      {showRevenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowRevenue(false)} dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-black text-green-600">📥 تسجيل إيراد</h3><button onClick={() => setShowRevenue(false)}><X size={20} className="text-gray-400" /></button></div>
            <div className="space-y-3">
              <div><label className="block text-sm font-bold mb-1">المصدر *</label>
                <input value={revForm.source} onChange={e => setRevForm(p => ({ ...p, source: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-green-400" />
              </div>
              <div><label className="block text-sm font-bold mb-1">الوصف</label>
                <input value={revForm.description} onChange={e => setRevForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-green-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-bold mb-1">المبلغ *</label>
                  <input type="number" value={revForm.amount || ''} onChange={e => setRevForm(p => ({ ...p, amount: +e.target.value || 0 }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none" />
                </div>
                <div><label className="block text-sm font-bold mb-1">التاريخ</label>
                  <input type="date" value={revForm.date} onChange={e => setRevForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowRevenue(false)} className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-50">إلغاء</button>
              <button onClick={handleAddRevenue} className="flex-1 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:opacity-90">حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
