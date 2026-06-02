import React, { useState } from 'react'
import { useStockSearch, updateStock } from '@/hooks/useStockTaking'
import { useCategories } from '@/hooks/useProducts'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency } from '@/lib/utils'
import { Search, Package, Save, Check, X, Filter, ClipboardList } from 'lucide-react'

interface StockRow {
  variantId: string
  productName: string
  sizeName: string
  sku: string
  barcode: string
  costPrice: number
  oldQuantity: number
  newQuantity: number
  inventoryId: string | null
  saving: boolean
  saved: boolean
}

export default function StockTakingPage() {
  const { activeWarehouse, user } = useAppStore()
  const { data: categories } = useCategories()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [pendingChanges, setPendingChanges] = useState<Record<string, number>>({})
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())

  const { data: variants, loading, refresh } = useStockSearch(search, categoryFilter)

  function getCurrentQty(v: any): number {
    const inv = v.inventory?.find((i: any) => i.warehouse_id === activeWarehouse?.id)
    return inv?.quantity ?? 0
  }

  function handleQtyChange(variantId: string, value: string) {
    const num = parseFloat(value) || 0
    setPendingChanges(prev => ({ ...prev, [variantId]: num }))
    setSavedIds(prev => { const s = new Set(prev); s.delete(variantId); return s })
  }

  async function handleSaveOne(v: any) {
    if (!activeWarehouse?.id) {
      alert('❌ لم يتم اختيار مخزن')
      return
    }
    const newQty = pendingChanges[v.id]
    if (newQty === undefined) return

    setSavingIds(prev => new Set(prev).add(v.id))

    const result = await updateStock(
      v.id,
      activeWarehouse.id,
      newQty,
      getCurrentQty(v),
      v.cost_price,
      user?.id
    )

    setSavingIds(prev => { const s = new Set(prev); s.delete(v.id); return s })

    if (result.success) {
      setSavedIds(prev => new Set(prev).add(v.id))
      setPendingChanges(prev => { const p = { ...prev }; delete p[v.id]; return p })
      setTimeout(() => refresh(), 500)
    } else {
      alert(`❌ خطأ: ${result.error}`)
    }
  }

  async function handleSaveAll() {
    const ids = Object.keys(pendingChanges)
    if (ids.length === 0) return
    if (!confirm(`حفظ ${ids.length} تعديل دفعة واحدة؟`)) return

    for (const id of ids) {
      const v = variants.find((x: any) => x.id === id)
      if (v) await handleSaveOne(v)
    }
  }

  const totalPending = Object.keys(pendingChanges).length
  const totalValue = variants.reduce((s: number, v: any) =>
    s + (getCurrentQty(v) * v.cost_price), 0)

  return (
    <div className="space-y-4" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">📋 الجرد السريع</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            تعديل كميات المخزون بسرعة |
            المخزن: <span className="font-bold text-blue-600">{activeWarehouse?.name ?? '-'}</span>
          </p>
        </div>
        {totalPending > 0 && (
          <button
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-bold shadow-lg hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(to left, #10B981, #059669)' }}
          >
            <Save size={16} /> حفظ الكل ({totalPending})
          </button>
        )}
      </div>

      {/* Stats */}
      {variants.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-black">{variants.length}</p>
              <p className="text-xs text-gray-500">عبوة ظاهرة</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
              <ClipboardList size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-black text-amber-700">{totalPending}</p>
              <p className="text-xs text-gray-500">تعديل في الانتظار</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
              <Check size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-lg font-black" style={{ color: '#D4AF37' }}>{formatCurrency(totalValue)}</p>
              <p className="text-xs text-gray-500">قيمة المعروض</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 بحث بالاسم أو SKU أو الباركود..."
              className="w-full pr-9 pl-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-gray-50"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white outline-none min-w-40"
          >
            <option value="">كل التصنيفات</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-gray-500">
          💡 ابحث عن المنتج → عدّل الكمية → اضغط ✅ للحفظ
        </p>
      </div>

      {/* Table */}
      {variants.length === 0 && !loading && (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <Package size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400 text-sm">
            {search.length === 0 && !categoryFilter
              ? '🔍 ابدأ بالبحث أو اختر تصنيف لعرض المنتجات'
              : 'لا توجد منتجات مطابقة'
            }
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-400">⏳ جاري البحث...</div>
      )}

      {variants.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white" style={{ background: 'linear-gradient(to left, #1B2E4B, #1B3A6B)' }}>
                  <th className="py-3 px-3 text-right text-xs font-bold">المنتج</th>
                  <th className="py-3 px-3 text-right text-xs font-bold">الحجم</th>
                  <th className="py-3 px-3 text-right text-xs font-bold">SKU</th>
                  <th className="py-3 px-3 text-center text-xs font-bold">الكمية الحالية</th>
                  <th className="py-3 px-3 text-center text-xs font-bold">الكمية الجديدة</th>
                  <th className="py-3 px-3 text-center text-xs font-bold">الفرق</th>
                  <th className="py-3 px-3 text-center text-xs font-bold">حفظ</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v: any) => {
                  const currentQty = getCurrentQty(v)
                  const pendingQty = pendingChanges[v.id]
                  const newQty = pendingQty ?? currentQty
                  const diff = newQty - currentQty
                  const hasChange = pendingQty !== undefined
                  const isSaving = savingIds.has(v.id)
                  const isSaved = savedIds.has(v.id)

                  return (
                    <tr
                      key={v.id}
                      className={`border-b border-gray-50 hover:bg-blue-50/20 transition-colors ${
                        hasChange ? 'bg-amber-50/40' : isSaved ? 'bg-green-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <p className="text-xs font-bold text-gray-900">{v.product?.name}</p>
                        <p className="text-[10px] text-gray-400">{v.product?.category?.name}</p>
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-600">{v.size_name}</td>
                      <td className="py-3 px-3 text-xs font-mono text-gray-500">{v.sku ?? '-'}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-sm font-black ${currentQty <= 0 ? 'text-red-600' : currentQty <= v.min_stock ? 'text-amber-600' : 'text-gray-800'}`}>
                          {currentQty}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={pendingQty ?? ''}
                          onChange={e => handleQtyChange(v.id, e.target.value)}
                          placeholder={String(currentQty)}
                          className="w-20 px-2 py-1.5 border-2 border-gray-200 rounded-lg text-sm text-center font-bold outline-none focus:border-amber-400"
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        {hasChange && (
                          <span className={`text-xs font-black ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isSaved ? (
                          <Check size={18} className="text-green-600 mx-auto" />
                        ) : hasChange ? (
                          <button
                            onClick={() => handleSaveOne(v)}
                            disabled={isSaving}
                            className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 active:scale-95 disabled:opacity-50"
                          >
                            {isSaving ? '⏳' : '✅ حفظ'}
                          </button>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hint */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800">
        <p className="font-bold mb-1">💡 نصائح:</p>
        <ul className="space-y-1 mr-4">
          <li>• اكتب اسم المنتج أو SKU أو امسح الباركود</li>
          <li>• اكتب الكمية الجديدة في الخانة</li>
          <li>• اضغط <strong>✅ حفظ</strong> لحفظ منتج واحد</li>
          <li>• اضغط <strong>💾 حفظ الكل</strong> لحفظ كل التعديلات دفعة واحدة</li>
          <li>• الصف الأصفر = في انتظار الحفظ | الأخضر = تم الحفظ ✅</li>
        </ul>
      </div>
    </div>
  )
}