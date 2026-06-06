import React, { lazy, Suspense } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/useAppStore'
import LoginPage from '@/pages/LoginPage'
import AppLayout from '@/components/layout/AppLayout'
import DashboardPage from '@/pages/DashboardPage'

// تحميل كسول لكل صفحة (تُحمّل عند الحاجة فقط)
const POSPage          = lazy(() => import('@/pages/POSPage'))
const ProductsPage     = lazy(() => import('@/pages/ProductsPage'))
const CustomersPage    = lazy(() => import('@/pages/CustomersPage'))
const SalesPage        = lazy(() => import('@/pages/SalesPage'))
const ColorsPage       = lazy(() => import('@/pages/ColorsPage'))
const ContractorsPage  = lazy(() => import('@/pages/ContractorsPage'))
const InventoryPage    = lazy(() => import('@/pages/InventoryPage'))
const StockTakingPage  = lazy(() => import('@/pages/StockTakingPage'))
const SuppliersPage    = lazy(() => import('@/pages/SuppliersPage'))
const PurchasesPage    = lazy(() => import('@/pages/PurchasesPage'))
const AccountingPage   = lazy(() => import('@/pages/AccountingPage'))
const ProfitLossPage   = lazy(() => import('@/pages/ProfitLossPage'))
const ReportsPage      = lazy(() => import('@/pages/ReportsPage'))
const SettingsPage     = lazy(() => import('@/pages/SettingsPage'))

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#1B2E4B] flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="text-7xl mb-4 animate-pulse">🎨</div>
        <p className="text-white text-xl font-bold">جاري التحميل...</p>
      </div>
    </div>
  )
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20" dir="rtl">
      <div className="text-center">
        <div className="text-3xl mb-2 animate-pulse">⏳</div>
        <p className="text-gray-500 text-sm">جاري تحميل الصفحة...</p>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  const { activeModule } = useAppStore()

  if (loading) return <LoadingScreen />
  if (!user) return <LoginPage />

  const renderPage = () => {
    switch (activeModule) {
      case 'dashboard':    return <DashboardPage />
      case 'pos':          return <POSPage />
      case 'products':     return <ProductsPage />
      case 'customers':    return <CustomersPage />
      case 'sales':        return <SalesPage />
      case 'colors':       return <ColorsPage />
      case 'contractors':  return <ContractorsPage />
      case 'inventory':    return <InventoryPage />
      case 'stock-taking': return <StockTakingPage />
      case 'suppliers':    return <SuppliersPage />
      case 'purchases':    return <PurchasesPage />
      case 'accounting':   return <AccountingPage />
      case 'profit-loss':  return <ProfitLossPage />
      case 'reports':      return <ReportsPage />
      case 'settings':     return <SettingsPage />
      default:             return <DashboardPage />
    }
  }

  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        {renderPage()}
      </Suspense>
    </AppLayout>
  )
}
