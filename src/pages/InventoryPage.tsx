import React, { useState } from 'react'
import { useInventoryList, useInventoryMovements } from '@/hooks/useInventory'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Search, Package, ArrowDownUp } from 'lucide-react'

const MOV_LABELS: Record<string, string> = {
  purchase: 'شراء', sale: 'بيع', sale_return: 'مرتجع بيع',
  purchase_return: 'مرتجع شراء', transfer_in: 'تحويل وارد',
  transfer_out: 'تحويل صادر', adjustment_add: 'تسوية إضافة',
  adjustment_sub: 'تسوية خصم', opening: 'رصيد أول', damage: 'تالف'
}

export default function InventoryPage() {
  const [search, setSearch]   = useState('')
  const [tab, setTab]         = useState<'stock' | 'movements'>('stock')
  const { data: inventory, loading: invLoading }   = useInventoryList(search)
  const { data: movements,  loading: movLoading } = useInventoryMovements()

  const lowStock   = inventory.filter((i: any) => i.quantity <= (i.variant?.min_stock ?? 5) && i.quantity > 0)
  const outOfStock = inventory.filter((i: any) => i.quantity <= 0)
  const totalValue = inventory.reduce((s: number, i: any) => s + (i.quantity * (i.avg_cost ?? 0)), 0)

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">🏭 إدارة المخزون</h1>
          <p className="text-sm text-gray-500">
            قيمة المخزون: <span style={{ color: '#D4AF37' }} className="font-bold">{formatCurrency(totalValue)}</span>
            {lowStock.length > 0 && <span className="text-amber-600 font-bold mr-2">| ⚠️ {lowStock.length} منخفض</span>}
            {outOfStock.length > 0 && <span className="text-red-600 font-bold mr-2">| ❌ {outOfStock.length} نفد</span>}
          </p>
        </div>
      </div>

      <div className="flex bg-white rounded-2xl border border-gray-100 p-1 gap-1">
        <button onClick={() => setTab('stock')} className={`flex-1 py-2 rounded-xl text-sm font-bold ${tab === 'stock' ? 'text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
          style={tab === 'stock' ? { backgroundColor: '#1B3A6B' } : {}}>
          📦 المخزون الحالي
        </button>
        <button onClick={() => setTab('movements')} className={`flex-1 py-2 rounded-xl text-sm font-bold ${tab === 'movements' ? 'text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
          style={tab === 'movements' ? { backgroundColor: '#1B3A6B' } : {}}>
          🔄 حركات المخزون
        </button>
      </div>

      {tab === 'stock' && (
        <>
          <div className="relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في المخزون..."
              className="w-full pr-9 pl-3 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white" style={{ background: 'linear-gradient(to left, #1B2E4B, #1B3A6B)' }}>
                    {['المنتج','الحجم','المخزن','الكمية','الحد الأدنى','التكلفة','القيمة','الحالة'].map(h => (
                      <th key={h} className="py-3 px-4 text-right text-xs font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invLoading ? (
                    <tr><td colSpan={8} className="text-center py-16 text-gray-400">⏳</td></tr>
                  ) : inventory.map((item: any) => {
                    const status = item.quantity <= 0 ? 'out' : item.quantity <= (item.variant?.min_stock ?? 5) ? 'low' : 'ok'
                    return (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-3 px-4 text-xs font-bold">{item.variant?.product?.name}</td>
                        <td className="py-3 px-4 text-xs text-gray-600">{item.variant?.size_name}</td>
                        <td className="py-3 px-4 text-xs text-gray-500">{item.warehouse?.name}</td>
                        <td className="py-3 px-4 text-xs font-black">{item.quantity}</td>
                        <td className="py-3 px-4 text-xs text-gray-500">{item.variant?.min_stock}</td>
                        <td className="py-3 px-4 text-xs text-gray-600">{formatCurrency(item.avg_cost)}</td>
                        <td className="py-3 px-4 text-xs font-bold" style={{ color: '#D4AF37' }}>{formatCurrency(item.quantity * item.avg_cost)}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            status === 'ok' ? 'bg-green-50 text-green-700' :
                            status === 'low' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {status === 'ok' ? 'كافي' : status === 'low' ? 'منخفض' : 'نفد'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'movements' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {['التاريخ','المنتج','الحركة','الكمية','قبل','بعد'].map(h => (
                    <th key={h} className="py-3 px-4 text-right text-xs font-bold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movLoading ? (
                  <tr><td colSpan={6} className="text-center py-16 text-gray-400">⏳</td></tr>
                ) : movements.map((m: any) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2.5 px-4 text-xs text-gray-400">{formatDateTime(m.created_at)}</td>
                    <td className="py-2.5 px-4 text-xs font-bold">{m.variant?.product?.name} - {m.variant?.size_name}</td>
                    <td className="py-2.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${m.quantity > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {MOV_LABELS[m.movement_type] ?? m.movement_type}
                      </span>
                    </td>
                    <td className={`py-2.5 px-4 text-xs font-black ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-gray-500">{m.qty_before}</td>
                    <td className="py-2.5 px-4 text-xs font-bold">{m.qty_after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}