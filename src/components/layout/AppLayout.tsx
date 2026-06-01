import React from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAppStore } from '@/store/useAppStore'

interface Props {
  children: React.ReactNode
}

export default function AppLayout({ children }: Props) {
  const { sidebarOpen } = useAppStore()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" dir="rtl">
      <Sidebar />

      <div
        className="flex flex-col flex-1 min-w-0 transition-all duration-300"
        style={{ marginRight: sidebarOpen ? '256px' : '64px' }}
      >
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}