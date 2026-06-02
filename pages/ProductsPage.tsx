import React, { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useCategories } from '@/hooks/useProducts'
import {
  useProductsList,
  useBrands,
  createProduct,
  updateProduct,
  deleteProduct,
  addVariant,
  updateVariant
} from '@/hooks/useProductsManagement'
import { formatCurrency } from '@/lib/utils'
import {
  Plus, Search, Edit2, Trash2, X, Package,
  ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react'
import type { Product, ProductVariant } from '@/types/database'

// ─── Modal: Add/Edit Product ────────────────────────────────
function ProductModal({
  product, categories, brands, defaultWarehouseId, onClose, onSaved
}: {
  product?: Product | null
  categories: any[]
  brands: any[]
  defaultWarehouseId?: string
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName]               = useState(product?.name ?? '')
  const [productCode, setProductCode] = useState(product?.product_code ?? '')
  const [categoryId, setCategoryId]   = useState(product?.category_id ?? '')
  const [brandId, setBrandId]         = useState(product?.brand_id ?? '')
  const [usageType, setUsageType]     = useState(product?.usage_type ?? '')
  const [isTintable, setIsTintable]   = useState(product?.is_tintable ?? false)
  const [saving, setSaving]           = useState(false)

  async function handleSave() {
    if (!name.trim()) {
      alert('اسم المنتج مطلوب')
      return
    }
    setSaving(true)

    const payload = {
      name: name.trim(),
      product_code: productCode.trim() || null,
      category_id: categoryId || null,
      brand_id: brandId || null,
      usage_type: usageType || null,
      is_tintable: isTintable
    }

    const result = product
      ? await updateProduct(product.id, payload)
      : await createProduct({ product: payload, variants: [], defaultWarehouseId })

    setSaving(false)

    if (result.success) {
      onSaved()
      onClose()
    } else {
      alert(`خطأ: ${result.error}`)
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-black text-gray-900">
            {product ? '✏️ تعديل منتج' : '➕ منتج جديد'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              اسم المنتج *
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">كود المنتج</label>
              <input
                value={productCode}
                onChange={e => setProductCode(e.target.value)}
                placeholder="JOT-XX-001"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">نوع الاستخدام</label>
              <select
                value={usageType}
                onChange={e => setUsageType(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white"
              >
                <option value="">اختر</option>
                <option value="interior">داخلي</option>
                <option value="exterior">خارجي</option>
                <option value="both">داخلي وخارجي</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">التصنيف</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white"
              >
                <option value="">اختر التصنيف</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">الماركة</label>
              <select
                value={brandId}
                onChange={e => setBrandId(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white"
              >
                <option value="">اختر الماركة</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-3">
            <input
              type="checkbox"
              id="tintable"
              checked={isTintable}
              onChange={e => setIsTintable(e.target.checked)}
              className="w-4 h-4 accent-purple-600"
            />
            <label htmlFor="tintable" className="text-sm font-bold text-purple-800">
              🎨 هذا المنتج يقبل التلوين
            </label>
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(to left, #1B3A6B, #1B2E4B)' }}
          >
            {saving ? '⏳ جاري الحفظ...' : product ? 'حفظ التعديلات' : 'إضافة المنتج'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal: Add Variant (Size) ──────────────────────────────
function VariantModal({
  productName, productId, defaultWarehouseId, onClose, onSaved
}: {
  productName: string
  productId: string
  defaultWarehouseId?: string
  onClose: () => void
  onSaved: () => void
}) {
  const [sizeName, setSizeName]   = useState('')
  const [sizeUnit, setSizeUnit]   = useState('liter')
  const [barcode, setBarcode]     = useState('')
  const [sku, setSku]             = useState('')
  const [costPrice, setCostPrice] = useState(0)
  const [salePrice, setSalePrice] = useState(0)
  const [minStock, setMinStock]   = useState(5)
  const [saving, setSaving]       = useState(false)

  const margin = salePrice > 0 ? (((salePrice - costPrice) / salePrice) * 100).toFixed(1) : '0'

  async function handleSave() {
    if (!sizeName.trim()) {
      alert('اسم الحجم مطلوب')
      return
    }
    setSaving(true)

    const result = await addVariant(productId, {
      size_name: sizeName.trim(),
      size_unit: sizeUnit,
      barcode: barcode.trim() || null,
      sku: sku.trim() || null,
      cost_price: costPrice,
      sale_price: salePrice,
      min_stock: minStock
    }, defaultWarehouseId)

    setSaving(false)

    if (result.success) {
      onSaved()
      onClose()
    } else {
      alert(`خطأ: ${result.error}`)
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-black text-gray-900">➕ إضافة عبوة</h3>
            <p className="text-xs text-gray-500 mt-0.5">{productName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">اسم الحجم *</label>
              <input
                value={sizeName}
                onChange={e => setSizeName(e.target.value)}
                placeholder="9 لتر"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">الوحدة</label>
              <select
                value={sizeUnit}
                onChange={e => setSizeUnit(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none bg-white"
              >
                <option value="liter">لتر</option>
                <option value="kg">كيلوجرام</option>
                <option value="piece">قطعة</option>
                <option value="set">طقم</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">الباركود</label>
              <input
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">SKU</label>
              <input
                value={sku}
                onChange={e => setSku(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">سعر الشراء</label>
              <input
                type="number"
                value={costPrice || ''}
                onChange={e => setCostPrice(+e.target.value || 0)}
                step="0.01"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">سعر البيع</label>
              <input
                type="number"
                value={salePrice || ''}
                onChange={e => setSalePrice(+e.target.value || 0)}
                step="0.01"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">الحد الأدنى</label>
              <input
                type="number"
                value={minStock || ''}
                onChange={e => setMinStock(+e.target.value || 0)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex items-end">
              <div
                className={`w-full rounded-xl p-2.5 text-center text-sm font-black ${
                  +margin >= 20 ? 'bg-green-50 text-green-700' :
                  +margin >= 10 ? 'bg-amber-50 text-amber-700' :
                  'bg-red-50 text-red-700'
                }`}
              >
                هامش: {margin}%
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(to left, #D4AF37, #B8960C)' }}
          >
            {saving ? '⏳' : 'إضافة'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Product Row with Expandable Variants ───────────────────
function ProductRow({
  product, onEdit, onDelete, onAddVariant
}: {
  product: Product
  onEdit: () => void
  onDelete: () => void
  onAddVariant: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const totalStock = product.variants?.reduce(
    (sum, v: any) => sum + (v.inventory?.[0]?.quantity ?? 0), 0
  ) ?? 0
  const hasLowStock = product.variants?.some(
    (v: any) => (v.inventory?.[0]?.quantity ?? 0) <= v.min_stock
  )

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-blue-50/20 transition-colors">
        <td className="py-3 px-3 w-8">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-700"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </td>
        <td className="py-3 px-2 w-12">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-base"
            style={{ background: 'linear-gradient(135deg, #1B2E4B, #1B3A6B)' }}
          >
            🎨
          </div>
        </td>
        <td className="py-3 px-3">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm font-bold text-gray-900">{product.name}</p>
              {product.product_code && (
                <p className="text-[11px] text-gray-400 font-mono">{product.product_code}</p>
              )}
            </div>
            {product.is_tintable && (
              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">
                🎨 تلوين
              </span>
            )}
          </div>
        </td>
        <td className="py-3 px-3 text-xs text-gray-500">
          {(product as any).category?.name ?? '-'}
        </td>
        <td className="py-3 px-3 text-xs text-gray-500">
          {(product as any).brand?.name ?? '-'}
        </td>
        <td className="py-3 px-3">
          <div className="flex items-center gap-1">
            <span className={`text-xs font-bold ${hasLowStock ? 'text-amber-600' : 'text-green-600'}`}>
              {totalStock}
            </span>
            {hasLowStock && <AlertTriangle size={12} className="text-amber-500" />}
          </div>
        </td>
        <td className="py-3 px-3 text-xs text-gray-500">
          {product.variants?.length ?? 0} عبوة
        </td>
        <td className="py-3 px-3">
          <div className="flex gap-1">
            <button
              onClick={onAddVariant}
              className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg"
              title="إضافة عبوة"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>

      {expanded && (product.variants ?? []).length > 0 && (
        <tr>
          <td colSpan={8} className="bg-gray-50/50 px-6 py-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-[10px] uppercase">
                  <th className="text-right py-1 px-2">SKU</th>
                  <th className="text-right py-1 px-2">الحجم</th>
                  <th className="text-right py-1 px-2">باركود</th>
                  <th className="text-right py-1 px-2">التكلفة</th>
                  <th className="text-right py-1 px-2">سعر البيع</th>
                  <th className="text-right py-1 px-2">المخزون</th>
                </tr>
              </thead>
              <tbody>
                {product.variants!.map((v: any) => {
                  const qty = v.inventory?.[0]?.quantity ?? 0
                  const margin = v.sale_price > 0
                    ? (((v.sale_price - v.cost_price) / v.sale_price) * 100).toFixed(1)
                    : '0'
                  return (
                    <tr key={v.id} className="border-b border-gray-100">
                      <td className="py-2 px-2 font-mono text-xs text-gray-500">{v.sku ?? '-'}</td>
                      <td className="py-2 px-2 text-xs font-bold">{v.size_name}</td>
                      <td className="py-2 px-2 font-mono text-xs text-gray-500">{v.barcode ?? '-'}</td>
                      <td className="py-2 px-2 text-xs text-gray-600">{formatCurrency(v.cost_price)}</td>
                      <td className="py-2 px-2 text-xs font-bold" style={{ color: '#D4AF37' }}>
                        {formatCurrency(v.sale_price)} ({margin}%)
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            qty <= 0 ? 'bg-red-50 text-red-700' :
                            qty <= v.min_stock ? 'bg-amber-50 text-amber-700' :
                            'bg-green-50 text-green-700'
                          }`}
                        >
                          {qty} / حد {v.min_stock}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Main Page ──────────────────────────────────────────────
export default function ProductsPage() {
  const { activeWarehouse } = useAppStore()
  const [search, setSearch]               = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showVariantFor, setShowVariantFor] = useState<Product | null>(null)

  const { data: categories } = useCategories()
  const brands = useBrands()
  const { data: products, loading, refresh } = useProductsList(search, categoryFilter)

  async function handleDelete(id: string, name: string) {
    if (!confirm(`حذف "${name}"؟`)) return
    const r = await deleteProduct(id)
    if (r.success) refresh()
    else alert(`خطأ: ${r.error}`)
  }

  const totalProducts  = products.length
  const totalLowStock  = products.reduce((s, p) =>
    s + (p.variants?.filter((v: any) =>
      (v.inventory?.[0]?.quantity ?? 0) <= v.min_stock
    ).length ?? 0), 0
  )

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">📦 إدارة المنتجات</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalProducts} منتج
            {totalLowStock > 0 && (
              <span className="text-amber-600 font-bold mr-2">
                | ⚠️ {totalLowStock} عبوة منخفضة
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowProductModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-bold shadow-lg hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(to left, #1B3A6B, #1B2E4B)' }}
        >
          <Plus size={16} /> منتج جديد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث في المنتجات..."
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-white" style={{ background: 'linear-gradient(to left, #1B2E4B, #1B3A6B)' }}>
                <th className="py-3 px-3 w-8" />
                <th className="py-3 px-2 w-12" />
                <th className="py-3 px-3 text-right text-xs font-bold">المنتج</th>
                <th className="py-3 px-3 text-right text-xs font-bold">التصنيف</th>
                <th className="py-3 px-3 text-right text-xs font-bold">الماركة</th>
                <th className="py-3 px-3 text-right text-xs font-bold">المخزون</th>
                <th className="py-3 px-3 text-right text-xs font-bold">العبوات</th>
                <th className="py-3 px-3 text-right text-xs font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-20 text-gray-400">⏳ جاري التحميل...</td></tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-20">
                    <Package size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-400 text-sm">لا توجد منتجات</p>
                  </td>
                </tr>
              ) : products.map(p => (
                <ProductRow
                  key={p.id}
                  product={p}
                  onEdit={() => setEditingProduct(p)}
                  onDelete={() => handleDelete(p.id, p.name)}
                  onAddVariant={() => setShowVariantFor(p)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {(showProductModal || editingProduct) && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          brands={brands}
          defaultWarehouseId={activeWarehouse?.id}
          onClose={() => { setShowProductModal(false); setEditingProduct(null) }}
          onSaved={refresh}
        />
      )}

      {showVariantFor && (
        <VariantModal
          productId={showVariantFor.id}
          productName={showVariantFor.name}
          defaultWarehouseId={activeWarehouse?.id}
          onClose={() => setShowVariantFor(null)}
          onSaved={refresh}
        />
      )}
    </div>
  )
}