import React, { useState } from 'react'
import { useColors } from '@/hooks/useProducts'
import { Search, X } from 'lucide-react'
import type { Color } from '@/types/database'

interface Props {
  onSelect: (color: Color) => void
  onClose: () => void
}

export default function ColorPicker({ onSelect, onClose }: Props) {
  const [search, setSearch] = useState('')
  const { data: colors, loading } = useColors(search)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
      dir="rtl"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-black text-gray-900">🎨 اختر اللون</h3>
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
              placeholder="ابحث بكود أو اسم اللون..."
              className="w-full pr-9 pl-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-purple-400 bg-gray-50"
            />
          </div>
        </div>

        {/* Colors Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-16 text-gray-400">
              ⏳ جاري التحميل...
            </div>
          ) : colors.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-2">🎨</p>
              <p className="text-sm">لا توجد ألوان مطابقة</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {colors.map(color => (
                <button
                  key={color.id}
                  onClick={() => onSelect(color)}
                  className="text-center hover:scale-105 transition-transform group"
                >
                  <div
                    className="w-full aspect-square rounded-xl border-2 border-gray-100 group-hover:border-purple-400 shadow-sm mb-1.5"
                    style={{ backgroundColor: color.hex_value ?? '#e5e7eb' }}
                  />
                  <p className="text-[10px] font-bold text-gray-700 leading-tight">
                    {color.color_code}
                  </p>
                  <p className="text-[9px] text-gray-400 truncate">
                    {color.color_name_ar ?? color.color_name}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}