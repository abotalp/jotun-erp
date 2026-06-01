import React, { useState } from 'react'
import { useCustomers } from '@/hooks/useProducts'
import { Search, X, UserPlus, Phone, MapPin } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Customer } from '@/types/database'

interface Props {
  onSelect: (customer: Customer | null) => void
  onClose: () => void
}

const TYPE_LABELS: Record<string, string> = {
  retail:     'عادي',
  wholesale:  'جملة',
  contractor: 'مقاول',
  engineer:   'مهندس',
  company:    'شركة',
  vip:        'VIP'
}

const TYPE_COLORS: Record<string, string> = {
  retail:     'bg-gray-100 text-gray-700',
  wholesale:  'bg-blue-100 text-blue-700',
  contractor: 'bg-orange-100 text-orange-700',
  engineer:   'bg-purple-100 text-purple-700',
  company:    'bg-indigo-100 text-indigo-700',
  vip:        'bg-yellow-100 text-yellow-700'
}

export default function CustomerSelector({ onSelect, onClose }: Props) {
  const [search, setSearch] = useState('')
  const { data: customers, loading } = useCustomers(search)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
      dir="rtl"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-black text-gray-900">👤 اختر العميل</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الهاتف..."
              className="w-full pr-9 pl-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-gray-50"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Walk-in option */}
          <button
            onClick={() => onSelect(null)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 text-gray-500 hover:text-blue-600 transition-all"
          >
            <UserPlus size={18} />
            <span className="text-sm font-bold">بدون عميل (نقدي عابر)</span>
          </button>

          {loading ? (
            <div className="text-center py-12 text-gray-400">
              ⏳ جاري التحميل...
            </div>
          ) : customers.map(c => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className="w-full flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-right"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #1B2E4B, #1B3A6B)' }}
              >
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-gray-900">{c.name}</p>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${TYPE_COLORS[c.customer_type] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {TYPE_LABELS[c.customer_type] ?? c.customer_type}
                  </span>
                </div>
                {(c.phone || c.mobile) && (
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <Phone size={10} /> {c.phone ?? c.mobile}
                  </p>
                )}
                {c.address && (
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1 truncate">
                    <MapPin size={10} /> {c.address}
                  </p>
                )}
              </div>
              {c.current_balance !== 0 && (
                <div className="text-left flex-shrink-0">
                  <p className={`text-xs font-bold ${c.current_balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {c.current_balance > 0 ? 'مديونية' : 'رصيد'}
                  </p>
                  <p className={`text-[11px] font-black ${c.current_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(Math.abs(c.current_balance))}
                  </p>
                </div>
              )}
            </button>
          ))}

          {!loading && customers.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">👤</p>
              <p className="text-sm">لا يوجد عملاء مطابقون</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}