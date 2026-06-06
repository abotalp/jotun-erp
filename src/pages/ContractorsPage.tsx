import React, { useState } from 'react'
import {
  useContractorsList, useContractorInvoices, useContractorLedger,
  useContractorStats, createContractor, deleteContractor, payContractorCommission
} from '@/hooks/useContractors'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Plus, Search, X, Trash2, HardHat, TrendingUp, DollarSign,
  Receipt, Wallet, Printer, Download, Check, Eye
} from 'lucide-react'

const TYPE_LABELS: Record<string, string> = { contractor: 'مقاول', engineer: 'مهندس', foreman: 'مقدم عمال' }
const TYPE_ICONS: Record<string, string> = { contractor: '👷', engineer: '👨‍💼', foreman: '🔧' }

function AddModal({ onClose, onSaved }: any) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'contractor' | 'engineer' | 'foreman'>('contractor')
  const [phone, setPhone] = useState('')
  const [commType, setCommType] = useState('percentage')
  const [commVal, setCommVal] = useState(5)
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
          <h3 className="text-lg font-black">➕ إضافة صنايعي / مهندس</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-bold mb-1">الاسم *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">النوع</label>
              <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm bg-white outline-none">
                <option value="contractor">صنايعي / مقاول</option>
                <option value="engineer">مهندس</option>
                <option value="foreman">مقدم عمال</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">الهاتف</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">نوع العمولة الافتراضي</label>
              <select value={commType} onChange={e => setCommType(e.target.value)} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm bg-white outline-none">
                <option value="percentage">نسبة %</option>
                <option value="fixed_amount">مبلغ ثابت</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">القيمة الافتراضية</label>
              <input value={commVal} onChange={e => setCommVal(+e.target.value || 0)} type="number" className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-orange-400" />
            </div>
          </div>
        </div>
        <div className="p-5 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 rounded-xl font-bold hover:bg-gray-50">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 text-white font-bold rounded-xl" style={{ background: 'linear-gradient(to left, #F97316, #EA580C)' }}>
            {saving ? '⏳' : 'إضافة'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ContractorDetailModal({ contractor, onClose }: any) {
  const { user } = useAppStore()
  const [tab, setTab] = useState<'invoices' | 'ledger'>('invoices')
  const stats = useContractorStats(contractor.id)
  const { data: invoices } = useContractorInvoices(contractor.id)
  const { data: ledger } = useContractorLedger(contractor.id)

  async function handlePay(commissionId: string, amount: number) {
    if (!confirm(`تأكيد سداد ${formatCurrency(amount)} للصنايعي؟\n\nسيتم خصم المبلغ من الخزينة.`)) return
    const r = await payContractorCommission(commissionId, amount, user?.id)
    if (r.success) {
      alert('✅ تم السداد')
      window.location.reload()
    } else alert(`خطأ: ${r.error}`)
  }

  function exportCSV() {
    const headers = ['التاريخ', 'الفاتورة', 'العميل', 'قيمة الفاتورة', 'العمولة', 'الحالة']
    const rows = ledger.map((c: any) => [
      formatDate(c.created_at),
      c.sale?.invoice_no ?? '-',
      c.sale?.customer?.name ?? '-',
      c.sale_amount?.toFixed(2) ?? '0',
      c.commission_amount?.toFixed(2) ?? '0',
      c.status === 'paid' ? 'مدفوعة' : 'معلقة'
    ])
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `كشف-عمولات-${contractor.name}.csv`
    a.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} dir="rtl">
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-4">

        <div className="text-white p-5 rounded-t-2xl" style={{ background: 'linear-gradient(to left, #EA580C, #F97316)' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
                {TYPE_ICONS[contractor.type]}
              </div>
              <div>
                <h3 className="text-xl font-black">{contractor.name}</h3>
                <p className="text-orange-200 text-sm">{contractor.phone ?? '-'}</p>
                <p className="text-[10px] text-orange-100 mt-1">{contractor.code} | {TYPE_LABELS[contractor.type]}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white"><X size={22} /></button>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              <div className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="text-sm font-black">{formatCurrency(stats.total)}</p>
                <p className="text-[9px] text-orange-200">إجمالي العمولات</p>
              </div>
              <div className="bg-green-500/30 rounded-xl p-2.5 text-center">
                <p className="text-sm font-black">{formatCurrency(stats.paid)}</p>
                <p className="text-[9px] text-orange-200">المسددة</p>
              </div>
              <div className={`rounded-xl p-2.5 text-center ${stats.pending > 0 ? 'bg-red-500/30' : 'bg-white/10'}`}>
                <p className="text-sm font-black">{formatCurrency(stats.pending)}</p>
                <p className="text-[9px] text-orange-200">المستحقة</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="text-sm font-black">{stats.invoicesCount}</p>
                <p className="text-[9px] text-orange-200">عدد الفواتير</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-black">{stats.lastSaleDate ? formatDate(stats.lastSaleDate) : '-'}</p>
                <p className="text-[9px] text-orange-200">آخر فاتورة</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-black">{stats.lastPaidDate ? formatDate(stats.lastPaidDate) : '-'}</p>
                <p className="text-[9px] text-orange-200">آخر سداد</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex border-b bg-gray-50">
          <button onClick={() => setTab('invoices')} className={`flex-1 py-3 text-sm font-bold ${tab === 'invoices' ? 'bg-white border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'}`}>
            🧾 الفواتير ({invoices.length})
          </button>
          <button onClick={() => setTab('ledger')} className={`flex-1 py-3 text-sm font-bold ${tab === 'ledger' ? 'bg-white border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'}`}>
            📊 كشف العمولات ({ledger.length})
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-4">
          {tab === 'invoices' && (
            invoices.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Receipt size={32} className="mx-auto mb-2" />
                <p>لا توجد فواتير</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b text-xs">
                    <th className="py-2.5 px-3 text-right">الفاتورة</th>
                    <th className="py-2.5 px-3 text-right">التاريخ</th>
                    <th className="py-2.5 px-3 text-right">العميل</th>
                    <th className="py-2.5 px-3 text-right">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b hover:bg-orange-50/20">
                      <td className="py-2.5 px-3 font-mono text-xs font-bold text-orange-600">{inv.invoice_no}</td>
                      <td className="py-2.5 px-3 text-xs">{formatDate(inv.date)}</td>
                      <td className="py-2.5 px-3 text-xs font-bold">{(inv.customer as any)?.name ?? 'عميل نقدي'}</td>
                      <td className="py-2.5 px-3 text-xs font-black text-amber-600">{formatCurrency(inv.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {tab === 'ledger' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold">كشف العمولات التفصيلي</h4>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:opacity-90">
                    <Printer size={12} /> طباعة
                  </button>
                  <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:opacity-90">
                    <Download size={12} /> Excel
                  </button>
                </div>
              </div>

              {ledger.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <DollarSign size={32} className="mx-auto mb-2" />
                  <p>لا توجد عمولات</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b text-xs">
                      <th className="py-2.5 px-3 text-right">التاريخ</th>
                      <th className="py-2.5 px-3 text-right">الفاتورة</th>
                      <th className="py-2.5 px-3 text-right">العميل</th>
                      <th className="py-2.5 px-3 text-center">قيمة الفاتورة</th>
                      <th className="py-2.5 px-3 text-center">العمولة</th>
                      <th className="py-2.5 px-3 text-center">الحالة</th>
                      <th className="py-2.5 px-3 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((c: any) => (
                      <tr key={c.id} className="border-b hover:bg-orange-50/20">
                        <td className="py-2.5 px-3 text-xs text-gray-500">{formatDate(c.created_at)}</td>
                        <td className="py-2.5 px-3 font-mono text-xs font-bold text-orange-600">{c.sale?.invoice_no ?? '-'}</td>
                        <td className="py-2.5 px-3 text-xs">{c.sale?.customer?.name ?? 'عميل نقدي'}</td>
                        <td className="py-2.5 px-3 text-xs text-center text-gray-600">{formatCurrency(c.sale_amount ?? 0)}</td>
                        <td className="py-2.5 px-3 text-sm text-center font-black text-orange-600">{formatCurrency(c.commission_amount)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${c.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {c.status === 'paid' ? '✅ مسددة' : '⏳ مستحقة'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {c.status === 'pending' && (
                            <button onClick={() => handlePay(c.id, c.commission_amount)} className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-bold hover:opacity-90">
                              <Check size={11} className="inline" /> سداد
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ContractorsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const { data, loading, refresh } = useContractorsList(search, typeFilter)

  async function handleDelete(c: any) {
    if (!confirm(`حذف ${c.name}؟`)) return
    await deleteContractor(c.id)
    refresh()
  }

  const totalSales = data.reduce((s, c) => s + c.total_sales, 0)
  const totalEarned = data.reduce((s, c) => s + (c.total_commissions_earned ?? 0), 0)
  const totalDue = data.reduce((s, c) => s + c.balance_due, 0)

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">👷 المقاولون والمهندسون</h1>
          <p className="text-sm text-gray-500">{data.length} مسجل | إجمالي المستحق: <span className="font-bold text-red-600">{formatCurrency(totalDue)}</span></p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-bold shadow-lg" style={{ background: 'linear-gradient(to left, #F97316, #EA580C)' }}>
          <Plus size={16} /> إضافة
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1B3A6B' }}>
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-black">{formatCurrency(totalSales)}</p>
            <p className="text-xs text-gray-500">إجمالي المبيعات</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#10B981' }}>
            <DollarSign size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-black">{formatCurrency(totalEarned)}</p>
            <p className="text-xs text-gray-500">إجمالي العمولات</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EF4444' }}>
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-black text-red-600">{formatCurrency(totalDue)}</p>
            <p className="text-xs text-gray-500">مستحق للدفع</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-4 flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="w-full pr-9 pl-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-orange-400 bg-gray-50" />
        </div>
        {['', 'contractor', 'engineer', 'foreman'].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${typeFilter === t ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {t === '' ? 'الكل' : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-20 text-gray-400">⏳</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border p-4">
              <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => setSelected(c)}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                  {TYPE_ICONS[c.type]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black">{c.name}</p>
                  <p className="text-[11px] text-orange-600 font-bold">{TYPE_LABELS[c.type]}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(c) }} className="text-red-400 hover:text-red-600 p-1">
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
              <button onClick={() => setSelected(c)} className="w-full py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-100">
                <Eye size={11} className="inline ml-1" /> كشف الحساب
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSaved={refresh} />}
      {selected && <ContractorDetailModal contractor={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
