import React, { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Wifi, WifiOff, Bell } from 'lucide-react'

const MODULE_TITLES: Record<string, string> = {
  dashboard:      'لوحة التحكم',
  pos:            'شاشة الكاشير',
  sales:          'سجل المبيعات',
  'open-invoices':'الفواتير المفتوحة',
  payments:       'المدفوعات والسندات',
  products:       'إدارة المنتجات',
  colors:         'نظام الألوان',
  customers:      'إدارة العملاء والموزعين',
  contractors:    'المقاولون والمهندسون',
  inventory:      'إدارة المخزون',
  'stock-taking': 'الجرد السريع',
  purchases:      'فواتير المشتريات',
  suppliers:      'الموردون',
  accounting:     'الحسابات والخزينة',
  'profit-loss':  'تقرير الأرباح والخسائر',
  reports:        'التقارير',
  settings:       'الإعدادات',
}

export default function Header() {
  const { activeModule, settings, activeWarehouse } = useAppStore()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const currentTime = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center gap-4 px-6 shadow-sm flex-shrink-0">
      <div className="flex-1">
        <h1 className="text-lg font-black text-gray-800">{MODULE_TITLES[activeModule] ?? 'لوحة التحكم'}</h1>
        <p className="text-xs text-gray-500">{currentTime}</p>
      </div>

      <div className="hidden md:flex flex-col items-end mr-4">
        <p className="text-sm font-bold text-gray-800">{settings?.store_name ?? 'معرض جوتن للدهانات'}</p>
        {activeWarehouse && <p className="text-[11px] text-gray-500">📦 {activeWarehouse.name}</p>}
      </div>

      <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold ${isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
        {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
        <span className="hidden sm:inline">{isOnline ? 'متصل' : 'غير متصل'}</span>
      </div>

      <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
        <Bell size={20} className="text-gray-600" />
      </button>
    </header>
  )
}
