import React, { useState } from 'react'
import { useColors } from '@/hooks/useProducts'
import { db } from '@/lib/supabase'
import { Search, X, Plus } from 'lucide-react'
import type { Color } from '@/types/database'

interface Props {
  onSelect: (color: Color) => void
  onClose: () => void
}

export default function ColorPicker({ onSelect, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [newHex, setNewHex] = useState('#FFFFFF')
  const [saving, setSaving] = useState(false)
  const { data: colors, loading } = useColors(search)
  const [refreshKey, setRefreshKey] = useState(0)

  async function handleAddColor() {
    if (!newCode.trim() || !newName.trim()) {
      alert('الكود والاسم مطلوبان')
      return
    }
    setSaving(true)

    const { data: newColor, error } = await db.colors().insert({
      color_code: newCode.trim(),
      color_name: newName.trim(),
      color_name_ar: newName.trim(),
      hex_value: newHex,
      color_family: 'neutral',
      is_active: true,
      is_popular: false
    }).select().single()

    setSaving(false)

    if (error) {
      alert(`خطأ: ${error.message}`)
      return
    }

    if (newColor) {
      onSelect(newColor as Color)
    }
  }

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:opacity-90"
            >
              <Plus size={14} /> {showAddForm ? 'إخفاء' : 'إضافة لون جديد'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Add New Color Form */}
        {showAddForm && (
          <div className="border-b border-purple-100 bg-purple-50 p-4">
            <h4 className="text-sm font-black text-purple-900 mb-3">➕ لون جديد</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">كود اللون *</label>
                <input
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  placeholder="مثال: 1234"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-mono outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">اسم اللون *</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="مثال: أزرق سماوي"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-purple-400"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">اللون (اختياري)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newHex}
                    onChange={e => setNewHex(e.target.value)}
                    className="w-16 h-10 rounded-lg cursor-pointer p-0.5 border-2 border-gray-200"
                  />
                  <input
                    value={newHex}
                    onChange={e => setNewHex(e.target.value)}
                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-mono outline-none"
                  />
                </div>
              </div>
              <div className="col-span-2 flex gap-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2 border-2 border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAddColor}
                  disabled={saving}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? '⏳ جاري الحفظ...' : '✅ إضافة واختيار'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
            <div className="text-center py-16 text-gray-400">⏳ جاري التحميل...</div>
          ) : colors.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-2">🎨</p>
              <p className="text-sm mb-2">لا توجد ألوان مطابقة</p>
              <button
                onClick={() => {
                  setShowAddForm(true)
                  setNewCode(search)
                }}
                className="text-purple-600 text-xs font-bold hover:underline"
              >
                + إضافة "{search}" كلون جديد
              </button>
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
