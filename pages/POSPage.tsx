import React, { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useCategories, usePosVariants } from '@/hooks/useProducts'
import { useCompleteSale } from '@/hooks/useSales'
import { formatCurrency, generateRowId } from '@/lib/utils'
import ColorPicker from '@/components/pos/ColorPicker'
import CustomerSelector from '@/components/pos/CustomerSelector'
import {
  Search, Plus, Minus, Trash2, X, ShoppingCart,
  Palette, User, Tag, CheckCircle, Receipt, Pause
} from 'lucide-react'
import type { ProductVariant, Color, Customer, CartItem } from '@/types/database'

export default function POSPage() {
  const {
    cart, addToCart, removeFromCart, updateCartItem, clearCart,
    customerId, customerName, setCustomer,
    discountType, discountValue, setDiscount,
    paymentMethod, setPaymentMethod,
    isTaxInvoice, toggleTaxInvoice,
    cartTotals, settings
  } = useAppStore()

  const [search, setSearch]                       = useState('')
  const [activeCategory, setActiveCategory]       = useState<string | null>(null)
  const [showColorPicker, setShowColorPicker]     = useState<string | null>(null)
  const [showCustomerSelect, setShowCustomerSelect] = useState(false)
  const [showPayModal, setShowPayModal]           = useState(false)
  const [paidAmount, setPaidAmount]               = useState(0)
  const [successInvoice, setSuccessInvoice]       = useState<string | null>(null)

  const searchRef = useRef<HTMLInputElement>(null)
  const { data: categories } = useCategories()
  const { data: variants, loading } = usePosVariants(search, activeCategory)
  const { completeSale, loading: saving } = useCompleteSale()
  const totals = cartTotals()

  useEffect(() => { searchRef.current?.focus() }, [])

  function handleAddProduct(v: ProductVariant) {
    const stock = v.inventory?.[0]?.quantity ?? 0
    if (stock <= 0) {
      alert('❌ المخزون نفد')
      return
    }
    const newItem: CartItem = {
      rowId:          generateRowId(),
      variantId:      v.id,
      productName:    v.product?.name ?? '',
      sizeName:       v.size_name,
      barcode:        v.barcode,
      unitPrice:      v.sale_price,
      originalPrice:  v.sale_price,
      costPrice:      v.cost_price,
      quantity:       1,
      discountPct:    0,
      discountAmount: 0,
      taxRate:        0,
      taxAmount:      0,
      subtotal:       v.sale_price,
      total:          v.sale_price,
      notes:          ''
    }
    addToCart(newItem)
  }

  function handleColorPick(color: Color) {
    if (!showColorPicker) return
    updateCartItem(showColorPicker, {
      color: {
        colorId:   color.id,
        colorCode: color.color_code,
        colorName: color.color_name_ar ?? color.color_name,
        hexValue:  color.hex_value ?? undefined
      }
    })
    setShowColorPicker(null)
  }

  function handleSelectCustomer(c: Customer | null) {
    if (c) setCustomer(c.id, c.name)
    else setCustomer(null, null)
    setShowCustomerSelect(false)
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      alert('السلة فارغة')
      return
    }
    const effectivePaid = paidAmount || totals.total

    const result = await completeSale({
      cart,
      customerId,
      contractorId: null,
      projectId: null,
      discountType,
      discountValue,
      paymentMethod,
      paidAmount: effectivePaid,
      isTaxInvoice,
      notes: '',
      contractorCommission: 0
    })

    if (result.success) {
      setSuccessInvoice(result.invoiceNo ?? '')
      setShowPayModal(false)
      clearCart()
      setPaidAmount(0)
      setTimeout(() => setSuccessInvoice(null), 4000)
    } else {
      alert(`خطأ: ${result.error}`)
    }
  }

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4" dir="rtl">

      {/* === RIGHT: Products Panel === */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-gray-100 overflow-hidden">

        {/* Search */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 بحث بالاسم أو الكود أو الباركود..."
              className="w-full pr-9 pl-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-gray-50"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-3 py-2 border-b border-gray-100 flex gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              activeCategory === null ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={activeCategory === null ? { backgroundColor: '#1B3A6B' } : {}}
          >
            الكل
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                activeCategory === cat.id ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={activeCategory === cat.id ? { backgroundColor: cat.color_hex } : {}}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="text-center py-12 text-gray-400">⏳ جاري التحميل...</div>
          ) : variants.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-2">🎨</p>
              <p className="text-sm">لا توجد منتجات</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {variants.map(v => {
                const stock = v.inventory?.[0]?.quantity ?? 0
                const outOfStock = stock <= 0
                return (
                  <button
                    key={v.id}
                    onClick={() => handleAddProduct(v)}
                    disabled={outOfStock}
                    className={`bg-white rounded-xl border-2 border-gray-100 p-3 text-right hover:border-blue-400 hover:shadow-md transition-all active:scale-95 ${outOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div
                      className="w-full h-20 rounded-lg mb-2 flex items-center justify-center text-3xl"
                      style={{ background: 'linear-gradient(135deg, #1B2E4B, #1B3A6B)' }}
                    >
                      🎨
                    </div>
                    <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight mb-1">
                      {(v as any).product?.name}
                    </p>
                    <p className="text-[10px] text-gray-400 mb-1">{v.size_name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black" style={{ color: '#D4AF37' }}>
                        {formatCurrency(v.sale_price)}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          stock > 10 ? 'bg-green-50 text-green-600' :
                          stock > 0 ? 'bg-amber-50 text-amber-600' :
                          'bg-red-50 text-red-600'
                        }`}
                      >
                        {stock}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* === LEFT: Cart Panel === */}
      <div className="w-[360px] flex-shrink-0 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden shadow-lg">

        {/* Cart Header */}
        <div className="text-white p-4" style={{ backgroundColor: '#1B2E4B' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black">🛒 الفاتورة</h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="bg-red-500/20 hover:bg-red-500/30 px-2 py-1 rounded-lg text-xs"
              >
                <Trash2 size={12} className="inline ml-1" /> مسح
              </button>
            )}
          </div>

          {/* Customer Selector */}
          <button
            onClick={() => setShowCustomerSelect(true)}
            className="w-full flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 transition-all text-right"
          >
            <User size={14} className="text-blue-300" />
            <span className="text-sm font-medium truncate flex-1">
              {customerName ?? 'بدون عميل - اضغط لاختيار'}
            </span>
          </button>

          {/* Tax Toggle */}
          <div className="flex items-center justify-between mt-3 px-1">
            <span className="text-xs text-blue-300">فاتورة ضريبية</span>
            <button
              onClick={toggleTaxInvoice}
              className="relative w-10 h-5 rounded-full transition-colors"
              style={{ backgroundColor: isTaxInvoice ? '#D4AF37' : 'rgba(255,255,255,0.2)' }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                style={{ [isTaxInvoice ? 'right' : 'left']: '2px' }}
              />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">السلة فارغة</p>
              <p className="text-xs mt-1">اضغط على منتج لإضافته</p>
            </div>
          ) : cart.map(item => (
            <div key={item.rowId} className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <button
                  onClick={() => removeFromCart(item.rowId)}
                  className="text-red-400 hover:text-red-600 mt-0.5"
                >
                  <X size={15} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{item.productName}</p>
                  <p className="text-[10px] text-gray-400">{item.sizeName}</p>
                  {item.color && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <div
                        className="w-3 h-3 rounded-full border border-gray-200"
                        style={{ backgroundColor: item.color.hexValue ?? '#ccc' }}
                      />
                      <span className="text-[10px] text-gray-500">
                        {item.color.colorCode} - {item.color.colorName}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm font-black" style={{ color: '#D4AF37' }}>
                  {formatCurrency(item.total)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-0.5">
                  <button
                    onClick={() => updateCartItem(item.rowId, { quantity: Math.max(1, item.quantity - 1) })}
                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900"
                  >
                    <Minus size={12} />
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={e => updateCartItem(item.rowId, { quantity: Math.max(1, +e.target.value || 1) })}
                    className="w-10 text-center text-xs font-bold bg-transparent outline-none"
                    min={1}
                  />
                  <button
                    onClick={() => updateCartItem(item.rowId, { quantity: item.quantity + 1 })}
                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <input
                  type="number"
                  value={item.originalPrice}
                  onChange={e => updateCartItem(item.rowId, { originalPrice: +e.target.value || 0 })}
                  className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg text-center outline-none focus:border-blue-400"
                />

                <button
                  onClick={() => setShowColorPicker(item.rowId)}
                  className={`p-1.5 rounded-lg ${item.color ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400 hover:bg-purple-50'}`}
                >
                  <Palette size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Totals + Checkout */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 bg-white p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-gray-400" />
              <select
                value={discountType}
                onChange={e => setDiscount(e.target.value as any, discountValue)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none"
              >
                <option value="percentage">خصم %</option>
                <option value="fixed">خصم ثابت</option>
              </select>
              <input
                type="number"
                value={discountValue || ''}
                onChange={e => setDiscount(discountType, +e.target.value || 0)}
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none text-center"
                placeholder="0"
                min={0}
              />
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>المجموع</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>الخصم</span>
                  <span>- {formatCurrency(totals.discountAmount)}</span>
                </div>
              )}
              {isTaxInvoice && (
                <div className="flex justify-between text-gray-500">
                  <span>ضريبة {settings?.default_tax_rate ?? 14}%</span>
                  <span>{formatCurrency(totals.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-lg text-gray-900 pt-1 border-t border-gray-100">
                <span>الإجمالي</span>
                <span style={{ color: '#D4AF37' }}>{formatCurrency(totals.total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { v: 'cash', l: 'نقدي' },
                { v: 'visa', l: 'فيزا' },
                { v: 'bank_transfer', l: 'تحويل' }
              ].map(pm => (
                <button
                  key={pm.v}
                  onClick={() => setPaymentMethod(pm.v)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    paymentMethod === pm.v ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={paymentMethod === pm.v ? { backgroundColor: '#1B3A6B' } : {}}
                >
                  {pm.l}
                </button>
              ))}
            </div>

            <button
              onClick={() => { setPaidAmount(totals.total); setShowPayModal(true) }}
              disabled={saving}
              className="w-full py-3 text-white font-black rounded-xl text-base shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(to left, #D4AF37, #B8960C)' }}
            >
              <CheckCircle size={18} className="inline ml-1" /> إتمام البيع
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showColorPicker && (
        <ColorPicker
          onSelect={handleColorPick}
          onClose={() => setShowColorPicker(null)}
        />
      )}

      {showCustomerSelect && (
        <CustomerSelector
          onSelect={handleSelectCustomer}
          onClose={() => setShowCustomerSelect(false)}
        />
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-black text-gray-900 mb-4">💰 تأكيد الدفع</h3>

            <div className="text-white rounded-xl p-4 mb-4 text-center" style={{ backgroundColor: '#1B2E4B' }}>
              <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>الإجمالي المطلوب</p>
              <p className="text-3xl font-black" style={{ color: '#D4AF37' }}>
                {formatCurrency(totals.total)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">المبلغ المدفوع</label>
              <input
                type="number"
                value={paidAmount || ''}
                onChange={e => setPaidAmount(+e.target.value || 0)}
                className="w-full px-4 py-3 text-xl font-black text-center border-2 border-gray-200 rounded-xl outline-none focus:border-amber-400"
                autoFocus
              />
            </div>

            {paidAmount > totals.total && (
              <div className="bg-green-50 rounded-xl p-3 mb-4 text-center">
                <p className="text-sm text-green-700 font-bold">
                  الباقي: {formatCurrency(paidAmount - totals.total)}
                </p>
              </div>
            )}

            {paidAmount < totals.total && paidAmount > 0 && (
              <div className="bg-amber-50 rounded-xl p-3 mb-4 text-center">
                <p className="text-sm text-amber-700 font-bold">
                  متبقي (آجل): {formatCurrency(totals.total - paidAmount)}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowPayModal(false)}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleCheckout}
                disabled={saving || paidAmount <= 0}
                className="flex-1 py-3 text-white font-black rounded-xl hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(to left, #D4AF37, #B8960C)' }}
              >
                {saving ? '⏳' : <><Receipt size={16} className="inline ml-1" /> حفظ</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successInvoice && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-2">
            <CheckCircle size={20} />
            ✅ تم إصدار الفاتورة {successInvoice}
          </div>
        </div>
      )}
    </div>
  )
}