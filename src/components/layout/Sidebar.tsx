import React from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard, ShoppingCart, Package, Palette, Users,
  HardHat, Warehouse, ShoppingBag, FileText, Calculator,
  BarChart3, Settings, LogOut, ChevronRight, Truck
} from 'lucide-react'

const NAV_ITEMS = [
  { key: 'dashboard',   icon: LayoutDashboard, label: 'لوحة التحكم',  roles: ['admin','manager','cashier','warehouse'] },
  { key: 'pos',         icon: ShoppingCart,    label: 'الكاشير',        roles: ['admin','manager','cashier'] },
  { key: 'sales',       icon: FileText,        label: 'المبيعات',       roles: ['admin','manager','cashier'] },
  { key: 'products',    icon: Package,         label: 'المنتجات',       roles: ['admin','manager','warehouse'] },
  { key: 'colors',      icon: Palette,         label: 'نظام الألوان',   roles: ['admin','manager','cashier'] },
  { key: 'customers',   icon: Users,           label: 'العملاء',        roles: ['admin','manager','cashier'] },
  { key: 'contractors', icon: HardHat,         label: 'المقاولون',      roles: ['admin','manager'] },
  { key: 'inventory',   icon: Warehouse,       label: 'المخزون',        roles: ['admin','manager','warehouse'] },
  { key: 'purchases',   icon: ShoppingBag,     label: 'المشتريات',      roles: ['admin','manager','warehouse'] },
  { key: 'suppliers',   icon: Truck,           label: 'الموردون',       roles: ['admin','manager'] },
  { key: 'accounting',  icon: Calculator,      label: 'الحسابات',       roles: ['admin','manager'] },
  { key: 'reports',     icon: BarChart3,       label: 'التقارير',       roles: ['admin','manager'] },
  { key: 'settings',    icon: Settings,        label: 'الإعدادات',      roles: ['admin'] },
]

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, activeModule, setActiveModule } = useAppStore()
  const { user, signOut } = useAuth()

  const visibleItems = NAV_ITEMS.filter(item =>
    user?.role ? item.roles.includes(user.role) : false
  )

  const roleLabel =
    user?.role === 'admin' ? 'مدير النظام' :
    user?.role === 'manager' ? 'مدير' :
    user?.role === 'cashier' ? 'كاشير' : 'مخزن'

  return (
    <aside
      className={`fixed right-0 top-0 h-full text-white z-40 flex flex-col transition-all duration-300 shadow-2xl ${sidebarOpen ? 'w-64' : 'w-16'}`}
      style={{ backgroundColor: '#1B2E4B' }}
    >
      {/* Logo Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 min-h-[64px]">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #B8960C)' }}
        >
          🎨
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-bold leading-tight">معرض جوتن</p>
            <p className="text-[11px] text-blue-300">للدهانات</p>
          </div>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ChevronRight
            size={16}
            className={`transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-1 px-2">
        {visibleItems.map(item => {
          const isActive = activeModule === item.key
          const Icon = item.icon
          return (
            <button
              key={item.key}
              onClick={() => setActiveModule(item.key)}
              title={!sidebarOpen ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full ${
                isActive
                  ? 'text-white shadow-lg'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`}
              style={isActive ? {
                background: 'linear-gradient(to left, #D4AF37, #B8960C)',
                boxShadow: '0 4px 12px rgba(212,175,55,0.3)'
              } : {}}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="truncate text-right">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* User Info + Logout */}
      <div className="border-t border-white/10 p-3 space-y-2">
        {sidebarOpen && user && (
          <div className="flex items-center gap-2 px-2 py-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: '#D4AF37' }}
            >
              {user.full_name.charAt(0)}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold truncate">{user.full_name}</p>
              <p className="text-[10px] text-blue-300">{roleLabel}</p>
            </div>
          </div>
        )}

        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {sidebarOpen && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  )
}