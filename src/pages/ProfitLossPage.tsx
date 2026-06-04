import React, { useState, useEffect } from 'react'
import { getProfitLossReport } from '@/hooks/useAccounting'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, DollarSign, Receipt, Calendar,
  PieChart, BarChart3, ArrowDownRight, ArrowUpRight
} from 'lucide-react'

type PeriodType = 'this-month' | 'last-month' | 'quarter' | 'half-year' | 'year' | 'custom'

const PERIODS: { v: PeriodType; l: string; icon: string }[] = [
  { v: 'this-month',  l: 'الشهر الحالي',     icon: '📅' },
  { v: 'last-month',  l: 'الشهر الماضي',     icon: '🗓️' },
  { v: 'quarter',     l: 'ربع سنوي',          icon: '📊' },
  { v: 'half-year',   l: 'نصف سنوي',         icon: '📈' },
  { v: 'year',        l: 'سنوي',              icon: '🗂️' },
  { v: 'custom',      l: 'مخصص',              icon: '🎯' },
]

function getPeriodDates(period: PeriodType): { from: string; to: string } {
  const today = new Date()
  let from: Date
  let to: Date = today

  switch (period) {
    case 'this-month':
      from = new Date(today.getFullYear(), today.getMonth(), 1)
      break
    case 'last-month':
      from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      to = new Date(today.getFullYear(), today.getMonth(), 0)
      break
    case 'quarter':
      from = new Date(today.getFullYear(), today.getMonth() - 2, 1)
      break
    case 'half-year':
      from = new Date(today.getFullYear(), today.getMonth() - 5, 1)
      break
    case 'year':
      from = new Date(today.getFullYear(), 0, 1)
      break
    default:
      from = new Date(today.getFullYear(), today.getMonth(), 1)
  }

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10)
  }
}

export default function ProfitLossPage() {
  const [period, setPeriod] = useState<PeriodType>('this-month')
  const [customFrom, setCustomFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
  const [customTo, setCustomTo] = useState(new Date().toISOString().slice(0, 10))
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const dates = period === 'custom'
      ? { from: customFrom, to: customTo }
      : getPeriodDates(period)

    setLoading(true)
    getProfitLossReport(dates.from, dates.to).then(data => {
      setReport(data)
      setLoading(false)
    })
  }, [period, customFrom, customTo])

  const periodDates = period === 'custom'
    ? { from: customFrom, to: customTo }
    : getPeriodDates(period)

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-4" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-black text-gray-900">📊 الأرباح والخسائر</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            تقارير مالية شاملة عن أداء المعرض
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-lg"
        >
          🖨️ طباعة التقرير
        </button>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 no-print">
        <h3 className="text-sm font-black text-gray-800">📅 اختر الفترة</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {PERIODS.map(p => (
            <button
              key={p.v}
              onClick={() => setPeriod(p.v)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                period === p.v ? 'text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={period === p.v ? { backgroundColor: '#1B3A6B' } : {}}
            >
              {p.icon} {p.l}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-3 pt-2">
            <Calendar size={16} className="text-gray-400" />
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
            />
            <span className="text-gray-400">إلى</span>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
            />
          </div>
        )}

        <div className="bg-blue-50 rounded-xl p-2 text-center text-xs text-blue-800">
          📅 الفترة: <strong>{periodDates.from}</strong> إلى <strong>{periodDates.to}</strong>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-black">معرض جوتن للدهانات</h1>
        <h2 className="text-xl font-bold mt-2">تقرير الأرباح والخسائر</h2>
        <p className="text-sm mt-1">الفترة من {periodDates.from} إلى {periodDates.to}</p>
        <hr className="my-3 border-2 border-black" />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">⏳ جاري حساب التقرير...</div>
      ) : !report ? (
        <div className="text-center py-20 text-gray-400">لا توجد بيانات</div>
      ) : (
        <>
          {/* Big Net Profit Card */}
          <div
            className="rounded-2xl p-8 text-center shadow-2xl"
            style={{
              background: report.netProfit >= 0
                ? 'linear-gradient(135deg, #10B981, #059669)'
                : 'linear-gradient(135deg, #EF4444, #DC2626)'
            }}
          >
            <p className="text-white/80 text-sm font-bold mb-2">صافي الربح / الخسارة</p>
            <p className="text-5xl font-black text-white mb-2">
              {report.netProfit >= 0 ? '+' : ''}{formatCurrency(report.netProfit)}
            </p>
            <p className="text-white/90 text-sm">
              {report.netProfit >= 0 ? '🎉 ربح صافي' : '⚠️ خسارة صافية'}
              {report.profitMargin !== 0 && ` | هامش الربح: ${report.profitMargin.toFixed(2)}%`}
            </p>
          </div>

          {/* Main KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border-2 border-blue-100 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Receipt size={18} className="text-blue-600" />
                </div>
                <span className="text-xs font-bold text-gray-500">{report.salesCount} فاتورة</span>
              </div>
              <p className="text-xl font-black text-blue-700">{formatCurrency(report.totalSales)}</p>
              <p className="text-xs text-gray-500 mt-1">إجمالي المبيعات</p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-red-100 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <ArrowDownRight size={18} className="text-red-600" />
                </div>
              </div>
              <p className="text-xl font-black text-red-700">{formatCurrency(report.totalReturns)}</p>
              <p className="text-xs text-gray-500 mt-1">المرتجعات</p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-amber-100 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <TrendingDown size={18} className="text-amber-600" />
                </div>
              </div>
              <p className="text-xl font-black text-amber-700">{formatCurrency(report.totalCost)}</p>
              <p className="text-xs text-gray-500 mt-1">تكلفة البضاعة</p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-green-100 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <TrendingUp size={18} className="text-green-600" />
                </div>
              </div>
              <p className="text-xl font-black text-green-700">{formatCurrency(report.grossProfit)}</p>
              <p className="text-xs text-gray-500 mt-1">إجمالي الربح</p>
            </div>
          </div>

          {/* P&L Statement */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <h3 className="text-base font-black text-gray-800">📋 قائمة الدخل التفصيلية</h3>
            </div>
            <div className="p-4 space-y-2">

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-700">📦 إجمالي المبيعات</span>
                <span className="text-base font-black text-blue-700">+ {formatCurrency(report.totalSales)}</span>
              </div>

              {report.totalReturns > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100 mr-4">
                  <span className="text-sm text-gray-600">− المرتجعات</span>
                  <span className="text-sm font-bold text-red-600">- {formatCurrency(report.totalReturns)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-2 border-b-2 border-gray-300 mr-4 bg-blue-50 px-3 rounded-lg">
                <span className="text-sm font-bold text-gray-700">= صافي المبيعات</span>
                <span className="text-base font-black text-blue-800">{formatCurrency(report.netSales)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100 mt-3">
                <span className="text-sm font-bold text-gray-700">📉 تكلفة البضاعة المباعة</span>
                <span className="text-base font-black text-amber-700">- {formatCurrency(report.totalCost)}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b-2 border-gray-300 bg-green-50 px-3 rounded-lg">
                <span className="text-sm font-bold text-gray-700">= مجمل الربح</span>
                <span className="text-lg font-black text-green-700">{formatCurrency(report.grossProfit)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100 mt-3">
                <span className="text-sm font-bold text-gray-700">📤 إجمالي المصروفات</span>
                <span className="text-base font-black text-red-700">- {formatCurrency(report.totalExpenses)}</span>
              </div>

              {report.totalOtherRevenue > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-bold text-gray-700">📥 إيرادات أخرى</span>
                  <span className="text-base font-black text-green-700">+ {formatCurrency(report.totalOtherRevenue)}</span>
                </div>
              )}

              <div
                className="flex justify-between items-center py-4 px-4 rounded-xl mt-4"
                style={{
                  background: report.netProfit >= 0
                    ? 'linear-gradient(to left, #10B981, #059669)'
                    : 'linear-gradient(to left, #EF4444, #DC2626)'
                }}
              >
                <span className="text-base font-black text-white">
                  {report.netProfit >= 0 ? '✅' : '⚠️'} صافي الربح / الخسارة
                </span>
                <span className="text-2xl font-black text-white">
                  {report.netProfit >= 0 ? '+' : ''}{formatCurrency(report.netProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* Expenses Breakdown */}
          {report.expensesByCategory.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <h3 className="text-base font-black text-gray-800">📊 توزيع المصروفات حسب التصنيف</h3>
              </div>
              <div className="p-4 space-y-2">
                {report.expensesByCategory.map((cat: any, i: number) => {
                  const percent = report.totalExpenses > 0 ? (cat.amount / report.totalExpenses * 100) : 0
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-700">
                          {cat.icon} {cat.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">{percent.toFixed(1)}%</span>
                          <span className="text-sm font-black text-red-600">{formatCurrency(cat.amount)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-l from-red-400 to-red-600"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">متوسط قيمة الفاتورة</p>
              <p className="text-xl font-black text-blue-700">
                {formatCurrency(report.salesCount > 0 ? report.totalSales / report.salesCount : 0)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">نسبة الربح من المبيعات</p>
              <p className="text-xl font-black text-green-700">
                {report.profitMargin.toFixed(2)}%
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">نسبة المصروفات من المبيعات</p>
              <p className="text-xl font-black text-amber-700">
                {report.netSales > 0 ? ((report.totalExpenses / report.netSales) * 100).toFixed(2) : 0}%
              </p>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  )
}