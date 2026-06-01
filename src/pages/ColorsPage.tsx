import React, { useState } from 'react'
import { useColorsList, useColorCollections, createColor, togglePopular } from '@/hooks/useColorsManagement'
import { Plus, Search, X, Star } from 'lucide-react'

const FAMILIES = [
  { v: 'warm', l: '🔴 دافئ' },
  { v: 'cool', l: '🔵 بارد' },
  { v: 'neutral', l: '⚪ محايد' },
  { v: 'white', l: '⬜ أبيض' },
  { v: 'grey', l: '🩶 رمادي' }
]

function AddColorModal({ collections, onClose, onSaved }: any) {
  const [code, setCode]       = useState('')
  const [name, setName]       = useState('')
  const [nameAr, setNameAr]   = useState('')
  const [hex, setHex]         = useState('#FFFFFF')
  const [collId, setCollId]   = useState('')
  const [family, setFamily]   = useState('neutral')
  const [saving, setSaving]   = useState(false)

  async function handleSave() {
    if (!code || !name) { alert('الكود والاسم مطلوبان'); return }
    setSaving(true)
    const r = await createColor({
      color_code: code, color_name: name, color_name_ar: nameAr || null,
      hex_value: hex, collection_id: collId || null, color_family: family as any
    })
    setSaving(false)
    if (r.success) { onSaved(); onClose() } else alert(r.error)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-black">➕ إضافة لون</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1">كود اللون *</label>
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="0500"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-mono outline-none focus:border-purple-400" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">اللون</label>
              <div className="flex gap-2">
                <input type="color" value={hex} onChange={e => setHex(e.target.value)} className="w-12 h-10 rounded-lg cursor-pointer p-0.5 border" />
                <input value={hex} onChange={e => setHex(e.target.value)} className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-mono outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">الاسم (EN) *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Egyptian Sand"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-purple-400" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">الاسم (AR)</label>
              <input value={nameAr} onChange={e => setNameAr(e.target.value)} placeholder="رمل مصر"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-purple-400" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">المجموعة</label>
              <select value={collId} onChange={e => setCollId(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white outline-none">
                <option value="">اختر</option>
                {collections.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">عائلة اللون</label>
              <select value={family} onChange={e => setFamily(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white outline-none">
                {FAMILIES.map(f => <option key={f.v} value={f.v}>{f.l}</option>)}
              </select>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden border border-gray-100 mt-3">
            <div className="h-16" style={{ backgroundColor: hex }} />
            <div className="p-2 bg-gray-50 text-center">
              <p className="text-sm font-black">{code || 'XXXX'}</p>
              <p className="text-xs text-gray-500">{nameAr || name || 'الاسم'}</p>
            </div>
          </div>
        </div>
        <div className="p-5 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-50">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 text-white font-bold rounded-xl" style={{ background: 'linear-gradient(to left, #1B3A6B, #1B2E4B)' }}>
            {saving ? '⏳' : 'إضافة'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ColorsPage() {
  const [search, setSearch]     = useState('')
  const [family, setFamily]     = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const collections             = useColorCollections()
  const { data, loading, refresh } = useColorsList(search, family)

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">🎨 نظام الألوان</h1>
          <p className="text-sm text-gray-500">{data.length} لون</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-bold shadow-lg hover:opacity-90"
          style={{ background: 'linear-gradient(to left, #8B5CF6, #6D28D9)' }}>
          <Plus size={16} /> إضافة لون
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بكود أو اسم..."
            className="w-full pr-9 pl-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-purple-400 bg-gray-50" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFamily('')} className={`px-3 py-1 rounded-full text-xs font-bold ${!family ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>الكل</button>
          {FAMILIES.map(f => (
            <button key={f.v} onClick={() => setFamily(family === f.v ? '' : f.v)} className={`px-3 py-1 rounded-full text-xs font-bold ${family === f.v ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f.l}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="text-center py-20 text-gray-400">⏳</div> : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {data.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              <div className="h-20 relative" style={{ backgroundColor: c.hex_value ?? '#e5e7eb' }}>
                <button onClick={() => togglePopular(c.id, !c.is_popular).then(refresh)}
                  className={`absolute top-1 left-1 p-1 rounded-full ${c.is_popular ? 'bg-yellow-400 text-white' : 'bg-white/80 text-gray-400 opacity-0 group-hover:opacity-100'}`}>
                  <Star size={10} fill={c.is_popular ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="p-2">
                <p className="text-[11px] font-black">{c.color_code}</p>
                <p className="text-[10px] text-gray-500 truncate">{c.color_name_ar ?? c.color_name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddColorModal collections={collections} onClose={() => setShowAdd(false)} onSaved={refresh} />}
    </div>
  )
}