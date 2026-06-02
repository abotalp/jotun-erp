import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/useAppStore'
import LoginPage from '@/pages/LoginPage'
import AppLayout from '@/components/layout/AppLayout'
import DashboardPage from '@/pages/DashboardPage'
import POSPage from '@/pages/POSPage'
import ProductsPage from '@/pages/ProductsPage'
import CustomersPage from '@/pages/CustomersPage'
import SalesPage from '@/pages/SalesPage'
import ColorsPage from '@/pages/ColorsPage'
import ContractorsPage from '@/pages/ContractorsPage'
import InventoryPage from '@/pages/InventoryPage'
import StockTakingPage from '@/pages/StockTakingPage'
import SuppliersPage from '@/pages/SuppliersPage'
import PurchasesPage from '@/pages/PurchasesPage'
import AccountingPage from '@/pages/AccountingPage'
import ReportsPage from '@/pages/ReportsPage'
import SettingsPage from '@/pages/SettingsPage'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1B2E4B, #1B3A6B)' }} dir="rtl">
      <div className="text-center">
        <div className="text-7xl mb-4 animate-pulse">🎨</div>
        <p className="text-white text-xl font-bold">معرض جوتن للدهانات</p>
        <p className="text-blue-300 text-sm mt-2">جاري التحميل...</p>
      </div>
    </div>
  )
}

function MainContent() {
  const { activeModule } = useAppStore()
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
    case 'reports':      return <ReportsPage />
    case 'settings':     return <SettingsPage />
    default:             return <DashboardPage />
  }
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <LoginPage />
  return <AppLayout><MainContent /></AppLayout>
}
