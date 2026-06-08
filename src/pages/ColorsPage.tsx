import React, { useState, useEffect } from 'react'
import { db } from '@/lib/supabase'
import { Plus, Search, X, Trash2, Edit2, Palette as PaletteIcon } from 'lucide-react'

export default function ColorsPage() {
  const [colors, setColors] = useState<any[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterCollection, setFilterCollection] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    let q = db.colors()
      .select(`*, collection:color_collections(id, name)`)
      .eq('is_active', true)
      .order('color_code')
      .limit(500)

    if (filterCollection) q = q.eq('collection_id', filterCollection)
    if (search.length >= 1) {
      q = q.or(`color_code.ilike.%${search}%,color_name.ilike.%${search}%,color_name_ar.ilike.%${search}%`)
    }

    q.then(({ data }) => {
      if (data) setColors(data)
      setLoading(false)
    })
  }, [search, filterCollection, refreshKey])

  useEffect(() => {
    db.color_collections().select('*').eq('is_active', true).order('name')
      .then(({ data }) => setCollections(data ?? []))
  }, [])

  async function handleDelete(c: any) {
    if (!confirm(`حذف اللون "${c.color_code}"؟`)) return
    const { error } = await db.colors().update({ is_active: false }).eq('id', c.id)
    if (error) alert(error.message)
    else setRefreshKey(k => k + 1)
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">🎨 نظام الألوان</h1>
          <p className="text-sm text-gray-500 mt-0.5">{colors.length} لون مسجل</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-bold shadow-lg hover:opacity-90"
          style={{ background: 'linear-gradient(to left, #8B5CF6, #6D28D9)' }}>
          <Plus size={16} /> إضافة لون جديد
        </button>
      </div>

      <div className="bg-white rounded-2xl border p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بالكود أو الاسم..."
              className="w-full pr-9 pl-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-purple-400 bg-gray-50" />
          </div>
          <select value={filterCollection} onChange={e => setFilterCollection(e.target.value)} className="px-3 py-2.5 border-2 rounded-xl text-sm bg-white outline-none min-w-40">
            <option value="">كل المجموعات</option>
            {collections.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">⏳ جاري التحميل...</div>
      ) : colors.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border">
          <PaletteIcon size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400 text-sm">لا توجد ألوان مسجلة بعد</p>
          <p className="text-xs text-gray-400 mt-1">اضغط "إضافة لون جديد" للبدء</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white" style={{ background: 'linear-gradient(to left, #6D28D9, #8B5CF6)' }}>
                <th className="py-3 px-4 text-right text-xs font-bold">كود اللون</th>
                <th className="py-3 px-4 text-right text-xs font-bold">الاسم (عربي)</th>
                <th className="py-3 px-4 text-right text-xs font-bold">الاسم (إنجليزي)</th>
                <th className="py-3 px-4 text-right text-xs font-bold">المجموعة</th>
                <th className="py-3 px-4 text-right text-xs font-bold">ملاحظات</th>
                <th className="py-3 px-4 text-right text-xs font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {colors.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-purple-50/20">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center font-mono font-black text-purple-700 bg-purple-50">
                        {c.color_code}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm font-bold">{c.color_name_ar ?? '-'}</td>
                  <td className="py-3 px-4 text-xs text-gray-500">{c.color_name ?? '-'}</td>
                  <td className="py-3 px-4 text-xs">
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                      {c.collection?.name ?? 'بدون مجموعة'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">{c.color_family ?? '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button onClick={() => setEditing(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDelete(c)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(showAdd || editing) && (
        <ColorModal
          color={editing}
          collections={collections}
          onClose={() => { setShowAdd(false); setEditing(null) }}
          onSaved={() => { setRefreshKey(k => k + 1); setShowAdd(false); setEditing(null) }}
        />
      )}
    </div>
  )
}

function ColorModal({ color, collections, onClose, onSaved }: any) {
  const [code, setCode] = useState(color?.color_code ?? '')
  const [nameAr, setNameAr] = useState(color?.color_name_ar ?? '')
  const [nameEn, setNameEn] = useState(color?.color_name ?? '')
  const [collectionId, setCollectionId] = useState(color?.collection_id ?? '')
  const [notes, setNotes] = useState(color?.color_family ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!code.trim() || !nameAr.trim()) {
      alert('الكود والاسم العربي مطلوبان')
      return
    }
    setSaving(true)

    const payload = {
      color_code: code.trim(),
      color_name: nameEn.trim() || nameAr.trim(),
      color_name_ar: nameAr.trim(),
      collection_id: collectionId || null,
      color_family: notes.trim() || null,
      is_active: true
    }

    const { error } = color
      ? await db.colors().update(payload).eq('id', color.id)
      : await db.colors().insert(payload)

    setSaving(false)

    if (error) {
      alert(`خطأ: ${error.message}`)
      return
    }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} dir="rtl">
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-white p-5 rounded-t-2xl" style={{ background: 'linear-gradient(to left, #6D28D9, #8B5CF6)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black">
              {color ? '✏️ تعديل لون' : '➕ إضافة لون جديد'}
            </h3>
            <button onClick={onClose} className="text-white/60 hover:text-white"><X size={20} /></button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-purple-50 rounded-xl p-3 text-xs text-purple-800">
            💡 اكتب كود اللون من كتالوج جوتن أو من الصور
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">كود اللون *</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="مثال: 1234"
              className="w-full px-3 py-3 border-2 rounded-xl text-xl font-mono font-black text-center outline-none focus:border-purple-400"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">الاسم (عربي) *</label>
            <input
              value={nameAr}
              onChange={e => setNameAr(e.target.value)}
              placeholder="مثال: رمل الصحراء"
              className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">الاسم (إنجليزي) - اختياري</label>
            <input
              value={nameEn}
              onChange={e => setNameEn(e.target.value)}
              placeholder="Egyptian Sand"
              className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">المجموعة (اختياري)</label>
            <select
              value={collectionId}
              onChange={e => setCollectionId(e.target.value)}
              className="w-full px-3 py-2.5 border-2 rounded-xl text-sm bg-white outline-none"
            >
              <option value="">بدون مجموعة</option>
              {collections.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">ملاحظات (اختياري)</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="مثال: لون دافئ"
              className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-purple-400"
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-2">معاينة</p>
            <div className="inline-flex items-center gap-3 bg-white border-2 border-purple-200 rounded-xl px-4 py-3">
              <div className="w-12 h-12 rounded-lg border-2 border-gray-200 flex items-center justify-center font-mono font-black text-purple-700 bg-purple-50">
                {code || '....'}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{nameAr || 'اسم اللون'}</p>
                {nameEn && <p className="text-xs text-gray-500">{nameEn}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 rounded-xl font-bold hover:bg-gray-50">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(to left, #6D28D9, #8B5CF6)' }}>
            {saving ? '⏳' : (color ? 'حفظ التعديلات' : 'إضافة اللون')}
          </button>
        </div>
      </div>
    </div>
  )
}
