import React, { useState } from 'react'
import { useSalesReport, useTopProducts, useInventoryReport, useColorsReport, useCustomersReport } from '@/hooks/useReports'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Calendar, Download, TrendingUp, Package, Palette, Users, FileText } from 'lucide-react'

type ReportType = 'sales' | 'top-products' | 'inventory' | 'colors' | 'customers'

const REPORTS = [
  { v: 'sales', l: '💰 المبيعات', icon: TrendingUp, color: '#1B3A6B' },
  { v: 'top-products', l: '🏆 الأكثر مبيعاً', icon: Package, color: '#D4AF37' },
  { v: 'inventory', l: '📦 المخزون', icon: Package, color: '#10B981' },
  { v: 'colors', l: '🎨 الألوان', icon: Palette, color: '#8B5CF6' },
  { v: 'customers', l: '👥 العملاء', icon: Users, color: '#F97316' }
]

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('sales')
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10))
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0,10))

  const { data: salesData, loading: salesLoading } = useSalesReport(dateFrom, dateTo)
  const topProducts = useTopProducts(dateFrom, dateTo)
  const inventory = useInventoryReport()
  const colors = useColorsReport(dateFrom, dateTo)
  const customers = useCustomersReport()

  const totalRevenue = salesData.reduce((s, r: any) => s + r.total, 0)
  const totalProfit = salesData.reduce((s, r: any) => s + ((r.items as any[])?.reduce((p, i) => p + (i.profit ?? 0), 0) ?? 0), 0)
  const totalOrders = salesData.length

  function exportCSV(data: any[], filename: string) {
    if (!data.length) { alert('لا توجد بيانات للتصدير'); return }
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n')
    const csv = '\uFEFF' + headers + '\n' + rows
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${filename}.csv`; a.click()
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">📊 التقارير</h1>
        <button onClick={() => {
          let dataToExport: any[] = []
          let filename = ''
          if (activeReport === 'sales') { dataToExport = salesData.map((s: any) => ({ 'الفاتورة': s.invoice_no, 'التاريخ': formatDate(s.date), 'العميل': s.customer?.name ?? 'نقدي', 'الإجمالي': s.total, 'المدفوع': s.paid })); filename = 'تقرير-المبيعات' }
          else if (activeReport === 'top-products') { dataToExport = topProducts.map((p: any) => ({ 'المنتج': p.name, 'الكمية': p.qty, 'الإيراد': p.total, 'الربح': p.profit })); filename = 'الأكثر-مبيعاً' }
          else if (activeReport === 'inventory') { dataToExport = inventory.map((i: any) => ({ 'المنتج': i.variant?.product?.name, 'الحجم': i.variant?.size_name, 'الكمية': i.quantity, 'التكلفة': i.avg_cost, 'القيمة': i.quantity * i.avg_cost })); filename = 'المخزون' }
          else if (activeReport === 'colors') { dataToExport = colors.map((c: any) => ({ 'الكود': c.color_code, 'الاسم': c.color_name_ar ?? c.color_name, 'الكمية': c.totalQty, 'مرات الطلب': c.count })); filename = 'الألوان-الأكثر-طلباً' }
          else if (activeReport === 'customers') { dataToExport = customers.map((c: any) => ({ 'الاسم': c.name, 'الهاتف': c.phone, 'المدينة': c.city, 'إجمالي الشراء': c.total_purchases })); filename = 'العملاء' }
          exportCSV(dataToExport, filename)
        }}
          className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:opacity-90">
          <Download size={15} /> تصدير CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2 bg-white rounded-2xl border border-gray-100 p-3">
        {REPORTS.map(r => (
          <button key={r.v} onClick={() => setActiveReport(r.v as ReportType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeReport === r.v ? 'text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            style={activeReport === r.v ? { backgroundColor: r.color } : {}}>
            <r.icon size={14} /> {r.l}
          </button>
        ))}
      </div>

      {activeReport !== 'inventory' && activeReport !== 'customers' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
          <Calendar size={16} className="text-gray-400" />
          <div>
            <label className="text-xs text-gray-500 block mb-1">من</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-1.5 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">إلى</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-1.5 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
          </div>
        </div>
      )}

      {activeReport === 'sales' && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-2xl font-black" style={{ color: '#D4AF37' }}>{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">إجمالي الإيرادات</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-2xl font-black text-green-600">{formatCurrency(totalProfit)}</p>
              <p className="text-xs text-gray-500 mt-1">صافي الأرباح</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-2xl font-black" style={{ color: '#1B3A6B' }}>{totalOrders}</p>
              <p className="text-xs text-gray-500 mt-1">عدد الفواتير</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b">{['الفاتورة','التاريخ','العميل','الإجمالي','المدفوع','المتبقي'].map(h => <th key={h} className="py-3 px-4 text-right text-xs font-bold text-gray-600">{h}</th>)}</tr></thead>
              <tbody>
                {salesLoading ? <tr><td colSpan={6} className="text-center py-20 text-gray-400">⏳</td></tr> :
                  salesData.slice(0, 50).map((s: any) => (
                    <tr key={s.id} className="border-b border-gray-50">
                      <td className="py-2.5 px-4 text-xs font-mono font-bold" style={{ color: '#1B3A6B' }}>{s.invoice_no}</td>
                      <td className="py-2.5 px-4 text-xs text-gray-500">{formatDate(s.date)}</td>
                      <td className="py-2.5 px-4 text-xs font-bold">{s.customer?.name ?? 'نقدي'}</td>
                      <td className="py-2.5 px-4 text-xs font-black" style={{ color: '#D4AF37' }}>{formatCurrency(s.total)}</td>
                      <td className="py-2.5 px-4 text-xs text-green-600 font-bold">{formatCurrency(s.paid)}</td>
                      <td className="py-2.5 px-4 text-xs text-red-500 font-bold">{s.remaining > 0 ? formatCurrency(s.remaining) : '-'}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeReport === 'top-products' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b">{['#','المنتج','الكمية','الإيرادات','الربح'].map(h => <th key={h} className="py-3 px-4 text-right text-xs font-bold text-gray-600">{h}</th>)}</tr></thead>
            <tbody>
              {topProducts.map((p: any, i: number) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2.5 px-4 text-xs font-black text-amber-600">{i + 1}</td>
                  <td className="py-2.5 px-4 text-xs font-bold">{p.name}</td>
                  <td className="py-2.5 px-4 text-xs">{p.qty}</td>
                  <td className="py-2.5 px-4 text-xs font-black" style={{ color: '#D4AF37' }}>{formatCurrency(p.total)}</td>
                  <td className="py-2.5 px-4 text-xs font-bold text-green-600">{formatCurrency(p.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeReport === 'inventory' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b">{['المنتج','الحجم','التصنيف','الكمية','التكلفة','القيمة'].map(h => <th key={h} className="py-3 px-4 text-right text-xs font-bold text-gray-600">{h}</th>)}</tr></thead>
            <tbody>
              {inventory.map((i: any) => (
                <tr key={i.id} className={`border-b border-gray-50 ${i.quantity <= (i.variant?.min_stock ?? 5) ? 'bg-amber-50/30' : ''}`}>
                  <td className="py-2.5 px-4 text-xs font-bold">{i.variant?.product?.name}</td>
                  <td className="py-2.5 px-4 text-xs">{i.variant?.size_name}</td>
                  <td className="py-2.5 px-4 text-xs text-gray-500">{i.variant?.product?.category?.name}</td>
                  <td className="py-2.5 px-4 text-xs font-black">{i.quantity}</td>
                  <td className="py-2.5 px-4 text-xs">{formatCurrency(i.avg_cost)}</td>
                  <td className="py-2.5 px-4 text-xs font-black" style={{ color: '#D4AF37' }}>{formatCurrency(i.quantity * i.avg_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeReport === 'colors' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="text-sm font-black mb-3">🎨 الألوان الأكثر طلباً</h3>
            <div className="space-y-2">
              {colors.map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg border border-white shadow flex-shrink-0" style={{ backgroundColor: c.hex_value ?? '#ccc' }} />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold">{c.color_code}</span>
                      <span className="text-xs text-gray-500">{c.count} طلب</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                      <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (c.count / (colors[0]?.count || 1)) * 100)}%`, backgroundColor: c.hex_value ?? '#1B3A6B' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeReport === 'customers' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b">{['#','العميل','النوع','المدينة','إجمالي الشراء','الرصيد'].map(h => <th key={h} className="py-3 px-4 text-right text-xs font-bold text-gray-600">{h}</th>)}</tr></thead>
            <tbody>
              {customers.map((c: any, i: number) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2.5 px-4 text-xs font-black text-amber-600">{i + 1}</td>
                  <td className="py-2.5 px-4 text-xs font-bold">{c.name}</td>
                  <td className="py-2.5 px-4 text-xs text-gray-500">{c.customer_type}</td>
                  <td className="py-2.5 px-4 text-xs text-gray-500">{c.city ?? '-'}</td>
                  <td className="py-2.5 px-4 text-xs font-black" style={{ color: '#D4AF37' }}>{formatCurrency(c.total_purchases)}</td>
                  <td className={`py-2.5 px-4 text-xs font-black ${c.current_balance > 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(Math.abs(c.current_balance))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}