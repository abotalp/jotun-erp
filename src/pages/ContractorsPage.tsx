import React, { useState } from 'react'
import { useContractorsList, createContractor, deleteContractor } from '@/hooks/useContractors'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, X, Trash2, HardHat, TrendingUp, DollarSign } from 'lucide-react'

const TYPE_LABELS = { contractor: 'مقاول', engineer: 'مهندس', foreman: 'مقدم عمال' }
const TYPE_ICONS  = { contractor: '👷', engineer: '👨‍💼', foreman: '🔧' }

function AddModal({ onClose, onSaved }: any) {
  const [name, setName]     = useState('')
  const [type, setType]     = useState<'contractor'|'engineer'|'foreman'>('contractor')
  const [phone, setPhone]   = useState('')
  const [commType, setCommType] = useState('percentage')
  const [commVal, setCommVal]   = useState(3)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name) { alert('الاسم مطلوب'); return }
    setSaving(true)
    const r = await createContractor({
      name, type, phone: phone || null,
      commission_type: commType, commission_value: commVal
    })
    setSaving(false)
    if (r.success) { onSaved(); onClose() } else alert(r.error)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-black">➕ إضافة مقاول/مهندس</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-sm font-bold mb-1">الاسم *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1">النوع</label>
              <select value={type} onChange={e => setType(e.target.value as any)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white outline-none">
                <option value="contractor">مقاول</option>
                <option value="engineer">مهندس</option>
                <option value="foreman">مقدم عمال</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">الهاتف</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} type="tel"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">نوع العمولة</label>
              <select value={commType} onChange={e => setCommType(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white outline-none">
                <option value="percentage">نسبة %</option>
                <option value="fixed_amount">مبلغ ثابت</option>
                <option value="per_unit">لكل وحدة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">قيمة العمولة</label>
              <input type="number" value={commVal} onChange={e => setCommVal(+e.target.value || 0)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400" />
            </div>
          </div>
        </div>
        <div className="p-5 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-50">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 text-white font-bold rounded-xl"
            style={{ background: 'linear-gradient(to left, #F97316, #EA580C)' }}>
            {saving ? '⏳' : 'إضافة'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ContractorsPage() {
  const [search, setSearch]       = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showAdd, setShowAdd]     = useState(false)
  const { data, loading, refresh } = useContractorsList(search, typeFilter)

  async function handleDelete(c: any) {
    if (!confirm(`حذف ${c.name}؟`)) return
    await deleteContractor(c.id)
    refresh()
  }

  const totalSales = data.reduce((s, c) => s + c.total_sales, 0)
  const totalDue   = data.reduce((s, c) => s + c.balance_due, 0)

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">👷 المقاولون والمهندسون</h1>
          <p className="text-sm text-gray-500">{data.length} مسجل</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-bold shadow-lg hover:opacity-90"
          style={{ background: 'linear-gradient(to left, #F97316, #EA580C)' }}>
          <Plus size={16} /> إضافة
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1B3A6B' }}>
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-black">{formatCurrency(totalSales)}</p>
            <p className="text-xs text-gray-500">إجمالي المبيعات</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F97316' }}>
            <DollarSign size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-black text-orange-600">{formatCurrency(totalDue)}</p>
            <p className="text-xs text-gray-500">مستحق للدفع</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#10B981' }}>
            <HardHat size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-black">{data.length}</p>
            <p className="text-xs text-gray-500">إجمالي المسجلين</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
            className="w-full pr-9 pl-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 bg-gray-50" />
        </div>
        {['', 'contractor', 'engineer', 'foreman'].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${typeFilter === t ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {t === '' ? 'الكل' : (TYPE_LABELS as any)[t]}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-20 text-gray-400">⏳</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                  {(TYPE_ICONS as any)[c.type]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black">{c.name}</p>
                  <p className="text-[11px] text-orange-600 font-bold">{(TYPE_LABELS as any)[c.type]}</p>
                </div>
                <button onClick={() => handleDelete(c)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="font-black">{formatCurrency(c.total_sales)}</p>
                  <p className="text-gray-400 text-[10px]">المبيعات</p>
                </div>
                <div className={`rounded-lg p-2 text-center ${c.balance_due > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <p className={`font-black ${c.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(c.balance_due)}</p>
                  <p className="text-gray-400 text-[10px]">مستحق</p>
                </div>
              </div>
              <p className="text-[10px] text-center bg-gray-50 px-2 py-1 rounded-lg">
                العمولة: {c.commission_value}{c.commission_type === 'percentage' ? '%' : ' ج.م'}
              </p>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSaved={refresh} />}
    </div>
  )
}