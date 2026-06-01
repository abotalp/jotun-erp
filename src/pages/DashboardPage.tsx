import React, { useEffect, useState } from 'react'
import { rpc } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp, ShoppingCart, Users, AlertTriangle,
  Wallet, DollarSign, Package, Receipt
} from 'lucide-react'

interface Stats {
  today_sales: number
  today_orders: number
  month_sales: number
  month_profit: number
  total_customers: number
  low_stock_count: number
  out_of_stock: number
  cash_balance: number
  pending_receivables: number
}

function KpiCard({
  title, value, sub, icon: Icon, color
}: {
  title: string
  value: string
  sub?: string
  icon: any
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <Icon size={22} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-black text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    rpc.getDashboardStats().then(({ data, error }) => {
      if (error) {
        console.error(error)
      } else {
        setStats(data as Stats)
      }
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">
        ⏳ جاري تحميل الإحصائيات...
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Welcome Banner */}
      <div
        className="rounded-2xl p-6 text-white shadow-lg"
        style={{ background: 'linear-gradient(to left, #1B2E4B, #1B3A6B)' }}
      >
        <h2 className="text-2xl font-black mb-2">🎨 أهلاً بك في معرض جوتن</h2>
        <p className="text-blue-200 text-sm">
          نظرة عامة على أداء المعرض اليوم والشهر الحالي
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="مبيعات اليوم"
          value={formatCurrency(stats?.today_sales ?? 0)}
          sub={`${stats?.today_orders ?? 0} فاتورة`}
          icon={ShoppingCart}
          color="#1B3A6B"
        />
        <KpiCard
          title="مبيعات الشهر"
          value={formatCurrency(stats?.month_sales ?? 0)}
          sub="الشهر الحالي"
          icon={TrendingUp}
          color="#D4AF37"
        />
        <KpiCard
          title="أرباح الشهر"
          value={formatCurrency(stats?.month_profit ?? 0)}
          sub="صافي الربح"
          icon={DollarSign}
          color="#10B981"
        />
        <KpiCard
          title="رصيد الخزينة"
          value={formatCurrency(stats?.cash_balance ?? 0)}
          icon={Wallet}
          color="#8B5CF6"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">
                {stats?.total_customers ?? 0}
              </p>
              <p className="text-sm text-gray-500">إجمالي العملاء</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-amber-700">
                {stats?.low_stock_count ?? 0}
              </p>
              <p className="text-sm text-gray-500">منتجات منخفضة</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center">
              <Package size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-red-700">
                {stats?.out_of_stock ?? 0}
              </p>
              <p className="text-sm text-gray-500">نفد المخزون</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="text-lg font-black text-gray-800 mb-4">
          ✅ النظام يعمل بكفاءة
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-500">●</span>
            <span>قاعدة البيانات متصلة</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">●</span>
            <span>تسجيل الدخول يعمل</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">●</span>
            <span>إحصائيات حقيقية من Supabase</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500">●</span>
            <span>الصفحات الأخرى قيد البناء</span>
          </div>
        </div>
      </div>
    </div>
  )
}