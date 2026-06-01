import React, { useState } from 'react'
import { useSalesList, cancelSale } from '@/hooks/useSalesList'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import {
  Search, Eye, X, FileText, Calendar,
  Receipt, TrendingUp, AlertCircle, Ban
} from 'lucide-react'
import type { Sale } from '@/types/database'

const STATUS_LABELS: Record<string, string> = {
  completed: 'مكتملة',
  draft:     'مسودة',
  cancelled: 'ملغاة',
  suspended: 'معلقة',
  refunded:  'مرتجعة'
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  draft:     'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
  suspended: 'bg-amber-100 text-amber-700',
  refunded:  'bg-blue-100 text-blue-700'
}

// ─── Sale Details Drawer ───────────────────────────────────
function SaleDetailDrawer({
  sale, onClose
}: {
  sale: Sale
  onClose: () => void
}) {
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
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-black font-mono">{sale.invoice_no}</h3>
              <p className="text-blue-300 text-xs mt-1">
                {formatDateTime(sale.date)}
              </p>
              {sale.is_tax_invoice && (
                <span className="inline-block mt-2 text-[10px] bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">
                  فاتورة ضريبية
                </span>
              )}
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-lg font-black" style={{ color: '#D4AF37' }}>
                {formatCurrency(sale.total)}
              </p>
              <p className="text-[10px] text-blue-300">الإجمالي</p>
            </div>
            <div className="bg-green-500/20 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-green-300">
                {formatCurrency(sale.paid)}
              </p>
              <p className="text-[10px] text-blue-300">المدفوع</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${sale.remaining > 0 ? 'bg-red-500/30' : 'bg-white/10'}`}>
              <p className="text-lg font-black">
                {formatCurrency(sale.remaining)}
              </p>
              <p className="text-[10px] text-blue-300">المتبقي</p>
            </div>
          </div>

          {(sale.customer as any)?.name && (
            <div className="mt-3 bg-white/10 rounded-xl p-2 text-center">
              <p className="text-xs text-blue-300">العميل</p>
              <p className="font-bold">{(sale.customer as any).name}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          <h4 className="text-sm font-black text-gray-800 mb-3">📦 بنود الفاتورة</h4>

          <div className="space-y-2">
            {(sale.items ?? []).map((item: any) => (
              <div key={item.id} className="bg-gray-50 rounded-xl p-3">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{item.product_name}</p>
                    <p className="text-[11px] text-gray-500">{item.size_name}</p>
                  </div>
                  <p className="text-sm font-black" style={{ color: '#D4AF37' }}>
                    {formatCurrency(item.total)}
                  </p>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{item.quantity} × {formatCurrency(item.unit_price)}</span>
                  {item.profit > 0 && (
                    <span className="text-green-600 font-bold">
                      ربح: {formatCurrency(item.profit)}
                    </span>
                  )}
                </div>

                {/* Color info */}
                {item.color && item.color.length > 0 && item.color[0]?.color_code && (
                  <div className="mt-2 flex items-center gap-2 text-[11px] bg-purple-50 text-purple-700 px-2 py-1 rounded-lg">
                    <span>🎨</span>
                    <span className="font-bold">{item.color[0].color_code}</span>
                    <span>-</span>
                    <span>{item.color[0].color_name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-4 bg-blue-50 rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>المجموع الفرعي</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>الخصم</span>
                <span>- {formatCurrency(sale.discount_amount)}</span>
              </div>
            )}
            {sale.tax_amount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>الضريبة ({sale.tax_rate}%)</span>
                <span>{formatCurrency(sale.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-base pt-1 border-t border-blue-200">
              <span>الإجمالي</span>
              <span style={{ color: '#D4AF37' }}>{formatCurrency(sale.total)}</span>
            </div>
          </div>

          {sale.notes && (
            <div className="mt-3 bg-amber-50 rounded-xl p-3 text-xs text-amber-800">
              <strong>ملاحظات:</strong> {sale.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────
export default function SalesPage() {
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('')
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  )
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10))
  const [viewingSale, setViewingSale] = useState<Sale | null>(null)

  const { data: sales, loading, refresh } = useSalesList({
    dateFrom, dateTo, status, search
  })

  async function handleCancel(s: Sale) {
    if (!confirm(`إلغاء الفاتورة ${s.invoice_no}؟\nسيتم إرجاع المنتجات للمخزون.`)) return
    const r = await cancelSale(s.id)
    if (r.success) {
      alert('✅ تم إلغاء الفاتورة وإرجاع المنتجات')
      refresh()
    } else {
      alert(`❌ خطأ: ${r.error}`)
    }
  }

  const totalRevenue = sales
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.total, 0)

  const totalPending = sales
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.remaining, 0)

  const totalProfit = sales
    .filter(s => s.status === 'completed')
    .reduce((sum, s) =>
      sum + ((s.items as any[])?.reduce((p, i) => p + (i.profit ?? 0), 0) ?? 0)
    , 0)

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">📋 سجل المبيعات</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {sales.length} فاتورة
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#D4AF37' }}
          >
            <Receipt size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-black text-gray-900">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-gray-500">إجمالي الإيرادات</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#10B981' }}
          >
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-black text-gray-900">{formatCurrency(totalProfit)}</p>
            <p className="text-xs text-gray-500">صافي الأرباح</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: totalPending > 0 ? '#EF4444' : '#94A3B8' }}
          >
            <AlertCircle size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-black text-gray-900">{formatCurrency(totalPending)}</p>
            <p className="text-xs text-gray-500">آجل غير محصّل</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث برقم الفاتورة أو اسم العميل..."
              className="w-full pr-9 pl-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-gray-50"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-xs outline-none focus:border-blue-400"
            />
            <span className="text-gray-400">إلى</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-xs outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {[
            { v: '', l: 'الكل' },
            { v: 'completed', l: 'مكتملة' },
            { v: 'cancelled', l: 'ملغاة' },
            { v: 'refunded', l: 'مرتجعة' }
          ].map(s => (
            <button
              key={s.v}
              onClick={() => setStatus(s.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                status === s.v ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={status === s.v ? { backgroundColor: '#1B3A6B' } : {}}
            >
              {s.l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-white"
                style={{ background: 'linear-gradient(to left, #1B2E4B, #1B3A6B)' }}
              >
                <th className="py-3 px-4 text-right text-xs font-bold">رقم الفاتورة</th>
                <th className="py-3 px-4 text-right text-xs font-bold">التاريخ</th>
                <th className="py-3 px-4 text-right text-xs font-bold">العميل</th>
                <th className="py-3 px-4 text-right text-xs font-bold">الإجمالي</th>
                <th className="py-3 px-4 text-right text-xs font-bold">المدفوع</th>
                <th className="py-3 px-4 text-right text-xs font-bold">المتبقي</th>
                <th className="py-3 px-4 text-right text-xs font-bold">الدفع</th>
                <th className="py-3 px-4 text-right text-xs font-bold">الحالة</th>
                <th className="py-3 px-4 text-right text-xs font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-20 text-gray-400">⏳ جاري التحميل...</td></tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-20">
                    <FileText size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-400 text-sm">لا توجد فواتير</p>
                  </td>
                </tr>
              ) : sales.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs font-bold" style={{ color: '#1B3A6B' }}>
                    {s.invoice_no}
                    {s.is_tax_invoice && (
                      <span className="mr-1 text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                        ضريبية
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {formatDateTime(s.date)}
                  </td>
                  <td className="py-3 px-4 text-xs font-bold">
                    {(s.customer as any)?.name ?? 'عميل نقدي'}
                  </td>
                  <td className="py-3 px-4 text-xs font-black" style={{ color: '#D4AF37' }}>
                    {formatCurrency(s.total)}
                  </td>
                  <td className="py-3 px-4 text-xs font-bold text-green-600">
                    {formatCurrency(s.paid)}
                  </td>
                  <td className="py-3 px-4 text-xs font-bold text-red-500">
                    {s.remaining > 0 ? formatCurrency(s.remaining) : '—'}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {s.payment_method === 'cash'          ? 'نقدي'   :
                     s.payment_method === 'visa'          ? 'فيزا'   :
                     s.payment_method === 'bank_transfer' ? 'تحويل'  :
                     s.payment_method}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[s.status] ?? ''}`}>
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setViewingSale(s)}
                        title="عرض التفاصيل"
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye size={13} />
                      </button>
                      {s.status === 'completed' && (
                        <button
                          onClick={() => handleCancel(s)}
                          title="إلغاء الفاتورة"
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Ban size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Drawer */}
      {viewingSale && (
        <SaleDetailDrawer sale={viewingSale} onClose={() => setViewingSale(null)} />
      )}
    </div>
  )
}