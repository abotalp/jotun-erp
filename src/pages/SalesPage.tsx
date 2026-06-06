import React, { useState } from 'react'
import { useSalesList, cancelSale, returnSaleItems } from '@/hooks/useSalesList'
import { getInvoiceForReprint } from '@/hooks/useCustomersManagement'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import PrintInvoice from '@/components/pos/PrintInvoice'
import {
  Search, Eye, X, FileText, Calendar,
  Receipt, TrendingUp, AlertCircle, Ban, RotateCcw, Printer
} from 'lucide-react'
import type { Sale } from '@/types/database'

const STATUS_LABELS: Record<string, string> = {
  completed: 'مكتملة', draft: 'مسودة',
  cancelled: 'ملغاة', suspended: 'معلقة', refunded: 'مرتجعة'
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
  suspended: 'bg-amber-100 text-amber-700',
  refunded: 'bg-blue-100 text-blue-700'
}

function ReturnModal({ sale, onClose, onSuccess }: { sale: Sale; onClose: () => void; onSuccess: () => void }) {
  const { user } = useAppStore()
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)

  const items = (sale.items ?? []) as any[]
  const totalRefund = items.reduce((s, item) => {
    const qty = returnQtys[item.id] || 0
    return s + (qty * item.unit_price)
  }, 0)

  async function handleSubmit() {
    const itemsToReturn = items
      .filter(item => (returnQtys[item.id] || 0) > 0)
      .map(item => ({
        saleItemId: item.id,
        variantId: item.variant_id,
        quantity: returnQtys[item.id],
        unitPrice: item.unit_price
      }))

    if (itemsToReturn.length === 0) { alert('اختر أصناف للإرجاع'); return }
    setSaving(true)
    const result = await returnSaleItems(sale.id, itemsToReturn, user?.id)
    setSaving(false)
    if (result.success) {
      alert(`✅ تم إنشاء المرتجع: ${result.returnNo}`)
      onSuccess(); onClose()
    } else alert(`❌ خطأ: ${result.error}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} dir="rtl">
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="text-lg font-black">↩️ مرتجع فاتورة</h3>
            <p className="text-xs text-gray-500 mt-1">{sale.invoice_no}</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800">
            💡 اكتب الكمية المراد إرجاعها لكل صنف
          </div>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="bg-gray-50 rounded-xl p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-bold">{item.product_name}</p>
                    <p className="text-xs text-gray-500">{item.size_name}</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: '#D4AF37' }}>{formatCurrency(item.unit_price)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs">الكمية الأصلية: <strong>{item.quantity}</strong></span>
                  <div className="flex-1 flex items-center gap-2">
                    <label className="text-xs whitespace-nowrap">للإرجاع:</label>
                    <input type="number" min="0" max={item.quantity} value={returnQtys[item.id] || ''}
                      onChange={e => {
                        const val = Math.min(item.quantity, Math.max(0, +e.target.value || 0))
                        setReturnQtys(prev => ({ ...prev, [item.id]: val }))
                      }}
                      className="w-20 px-2 py-1 border-2 rounded-lg text-sm text-center outline-none focus:border-red-400" />
                    <button onClick={() => setReturnQtys(prev => ({ ...prev, [item.id]: item.quantity }))} className="text-xs text-blue-600 hover:underline">الكل</button>
                  </div>
                  {(returnQtys[item.id] || 0) > 0 && (
                    <span className="text-xs font-bold text-red-600">= {formatCurrency((returnQtys[item.id] || 0) * item.unit_price)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-red-50 rounded-xl border-2 border-red-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold">إجمالي المرتجع:</span>
              <span className="text-2xl font-black text-red-600">{formatCurrency(totalRefund)}</span>
            </div>
            <p className="text-xs text-red-700 mt-2">⚠️ سيتم خصم هذا المبلغ من الخزينة</p>
          </div>
        </div>
        <div className="p-5 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 rounded-xl font-bold hover:bg-gray-50">إلغاء</button>
          <button onClick={handleSubmit} disabled={saving || totalRefund === 0} className="flex-1 py-2.5 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50" style={{ background: 'linear-gradient(to left, #EF4444, #DC2626)' }}>
            {saving ? '⏳' : '↩️ تأكيد المرتجع'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SaleDetailDrawer({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} dir="rtl">
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
        <div className="text-white p-5 rounded-t-3xl" style={{ background: 'linear-gradient(to left, #1B2E4B, #1B3A6B)' }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-black font-mono">{sale.invoice_no}</h3>
              <p className="text-blue-300 text-xs mt-1">{formatDateTime(sale.date)}</p>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-lg font-black" style={{ color: '#D4AF37' }}>{formatCurrency(sale.total)}</p>
              <p className="text-[10px] text-blue-300">الإجمالي</p>
            </div>
            <div className="bg-green-500/20 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-green-300">{formatCurrency(sale.paid)}</p>
              <p className="text-[10px] text-blue-300">المدفوع</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${sale.remaining > 0 ? 'bg-red-500/30' : 'bg-white/10'}`}>
              <p className="text-lg font-black">{formatCurrency(sale.remaining)}</p>
              <p className="text-[10px] text-blue-300">المتبقي</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <h4 className="text-sm font-black mb-3">📦 بنود الفاتورة</h4>
          <div className="space-y-2">
            {(sale.items ?? []).map((item: any) => (
              <div key={item.id} className="bg-gray-50 rounded-xl p-3">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    <p className="text-sm font-bold">{item.product_name}</p>
                    <p className="text-[11px] text-gray-500">{item.size_name}</p>
                  </div>
                  <p className="text-sm font-black" style={{ color: '#D4AF37' }}>{formatCurrency(item.total)}</p>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{item.quantity} × {formatCurrency(item.unit_price)}</span>
                </div>
                {item.color && item.color.length > 0 && item.color[0]?.color_code && (
                  <div className="mt-2 text-[11px] bg-purple-50 text-purple-700 px-2 py-1 rounded-lg">
                    🎨 {item.color[0].color_code} - {item.color[0].color_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SalesPage() {
  const { user, settings } = useAppStore()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10))
  const [viewingSale, setViewingSale] = useState<Sale | null>(null)
  const [returningSale, setReturningSale] = useState<Sale | null>(null)
  const [printData, setPrintData] = useState<any>(null)

  const { data: sales, loading, refresh } = useSalesList({ dateFrom, dateTo, status, search })

  async function handleReprint(saleId: string) {
    const result = await getInvoiceForReprint(saleId)
    if (result.success) setPrintData(result.invoice)
    else alert(`خطأ: ${result.error}`)
  }

  async function handleCancel(s: Sale) {
    if (!confirm(`إلغاء الفاتورة ${s.invoice_no}؟\n\n⚠️ سيتم:\n- إرجاع المنتجات للمخزون\n- خصم ${formatCurrency(s.paid)} من الخزينة\n- تعديل رصيد العميل`)) return
    const r = await cancelSale(s.id, user?.id)
    if (r.success) {
      alert('✅ تم إلغاء الفاتورة')
      refresh()
    } else alert(`❌ ${r.error}`)
  }

  const totalRevenue = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.total, 0)
  const totalPending = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.remaining, 0)
  const totalProfit = sales.filter(s => s.status === 'completed').reduce((sum, s) =>
    sum + ((s.items as any[])?.reduce((p, i) => p + (i.profit ?? 0), 0) ?? 0), 0)

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">📋 سجل المبيعات</h1>
          <p className="text-sm text-gray-500 mt-0.5">{sales.length} فاتورة</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#D4AF37' }}>
            <Receipt size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-black">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-gray-500">إجمالي الإيرادات</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#10B981' }}>
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-black">{formatCurrency(totalProfit)}</p>
            <p className="text-xs text-gray-500">صافي الأرباح</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: totalPending > 0 ? '#EF4444' : '#94A3B8' }}>
            <AlertCircle size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-black">{formatCurrency(totalPending)}</p>
            <p className="text-xs text-gray-500">آجل غير محصّل</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث برقم الفاتورة..." className="w-full pr-9 pl-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-blue-400 bg-gray-50" />
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2.5 border-2 rounded-xl text-xs outline-none focus:border-blue-400" />
            <span className="text-gray-400">إلى</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2.5 border-2 rounded-xl text-xs outline-none focus:border-blue-400" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ v: '', l: 'الكل' }, { v: 'completed', l: 'مكتملة' }, { v: 'cancelled', l: 'ملغاة' }].map(s => (
            <button key={s.v} onClick={() => setStatus(s.v)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${status === s.v ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} style={status === s.v ? { backgroundColor: '#1B3A6B' } : {}}>
              {s.l}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white" style={{ background: 'linear-gradient(to left, #1B2E4B, #1B3A6B)' }}>
                <th className="py-3 px-4 text-right text-xs font-bold">الفاتورة</th>
                <th className="py-3 px-4 text-right text-xs font-bold">التاريخ</th>
                <th className="py-3 px-4 text-right text-xs font-bold">العميل</th>
                <th className="py-3 px-4 text-right text-xs font-bold">الإجمالي</th>
                <th className="py-3 px-4 text-right text-xs font-bold">المدفوع</th>
                <th className="py-3 px-4 text-right text-xs font-bold">المتبقي</th>
                <th className="py-3 px-4 text-right text-xs font-bold">الحالة</th>
                <th className="py-3 px-4 text-right text-xs font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-20 text-gray-400">⏳ جاري التحميل...</td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-20"><FileText size={32} className="mx-auto mb-2 text-gray-300" /><p className="text-gray-400 text-sm">لا توجد فواتير</p></td></tr>
              ) : sales.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-blue-50/20">
                  <td className="py-3 px-4 font-mono text-xs font-bold" style={{ color: '#1B3A6B' }}>
                    {s.invoice_no}
                    {s.is_tax_invoice && <span className="mr-1 text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">ضريبية</span>}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">{formatDateTime(s.date)}</td>
                  <td className="py-3 px-4 text-xs font-bold">{(s.customer as any)?.name ?? 'عميل نقدي'}</td>
                  <td className="py-3 px-4 text-xs font-black" style={{ color: '#D4AF37' }}>{formatCurrency(s.total)}</td>
                  <td className="py-3 px-4 text-xs font-bold text-green-600">{formatCurrency(s.paid)}</td>
                  <td className="py-3 px-4 text-xs font-bold text-red-500">{s.remaining > 0 ? formatCurrency(s.remaining) : '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[s.status] ?? ''}`}>{STATUS_LABELS[s.status] ?? s.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button onClick={() => setViewingSale(s)} title="عرض" className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                        <Eye size={13} />
                      </button>
                      <button onClick={() => handleReprint(s.id)} title="إعادة طباعة" className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg">
                        <Printer size={13} />
                      </button>
                      {s.status === 'completed' && (
                        <>
                          <button onClick={() => setReturningSale(s)} title="مرتجع جزئي" className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg">
                            <RotateCcw size={13} />
                          </button>
                          <button onClick={() => handleCancel(s)} title="إلغاء كامل" className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                            <Ban size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewingSale && <SaleDetailDrawer sale={viewingSale} onClose={() => setViewingSale(null)} />}
      {returningSale && <ReturnModal sale={returningSale} onClose={() => setReturningSale(null)} onSuccess={refresh} />}

      {printData && (
        <PrintInvoice
          invoice={printData}
          storeName={settings?.store_name}
          storePhone={settings?.store_phone ?? undefined}
          storeAddress={settings?.store_address ?? undefined}
          taxNumber={settings?.tax_number ?? undefined}
          receiptFooter={settings?.receipt_footer}
          onClose={() => setPrintData(null)}
        />
      )}
    </div>
  )
}
