import React, { useState, useRef } from 'react'
import {
  useCustomersList, useCustomerInvoices, useCustomerPayments,
  useCustomerLedger, useCustomerStats, useCustomerColorHistory,
  createCustomer, updateCustomer, deleteCustomer, getInvoiceForReprint
} from '@/hooks/useCustomersManagement'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import PrintInvoice from '@/components/pos/PrintInvoice'
import {
  Plus, Search, Edit2, Trash2, X, Phone, MapPin,
  Users, FileText, History, Palette, Receipt, Printer,
  TrendingUp, TrendingDown, Wallet, ShoppingBag, Eye,
  ChevronDown, Download
} from 'lucide-react'
import type { Customer } from '@/types/database'

const TYPE_LABELS: Record<string, string> = {
  retail: 'عادي', wholesale: 'جملة', contractor: 'مقاول',
  engineer: 'مهندس', company: 'شركة', vip: 'VIP'
}

const TYPE_COLORS: Record<string, string> = {
  retail: 'bg-gray-100 text-gray-700',
  wholesale: 'bg-blue-100 text-blue-700',
  contractor: 'bg-orange-100 text-orange-700',
  engineer: 'bg-purple-100 text-purple-700',
  company: 'bg-indigo-100 text-indigo-700',
  vip: 'bg-yellow-100 text-yellow-700'
}

// Modal إضافة/تعديل عميل (نفس السابق)
function CustomerModal({ customer, onClose, onSaved }: any) {
  const [name, setName] = useState(customer?.name ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [mobile, setMobile] = useState(customer?.mobile ?? '')
  const [email, setEmail] = useState(customer?.email ?? '')
  const [address, setAddress] = useState(customer?.address ?? '')
  const [city, setCity] = useState(customer?.city ?? '')
  const [customerType, setCustomerType] = useState(customer?.customer_type ?? 'retail')
  const [creditLimit, setCreditLimit] = useState(customer?.credit_limit ?? 0)
  const [defaultDiscount, setDefaultDiscount] = useState(customer?.default_discount ?? 0)
  const [notes, setNotes] = useState(customer?.notes ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) { alert('الاسم مطلوب'); return }
    setSaving(true)
    const payload: any = {
      name: name.trim(),
      phone: phone.trim() || null,
      mobile: mobile.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      customer_type: customerType,
      credit_limit: creditLimit,
      default_discount: defaultDiscount,
      notes: notes.trim() || null
    }
    const result = customer
      ? await updateCustomer(customer.id, payload)
      : await createCustomer(payload)
    setSaving(false)
    if (result.success) { onSaved(); onClose() }
    else alert(`خطأ: ${result.error}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} dir="rtl">
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-black">{customer ? '✏️ تعديل عميل' : '➕ عميل جديد'}</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div><label className="block text-sm font-bold mb-1">الاسم *</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-blue-400" /></div>
          <div><label className="block text-sm font-bold mb-1">نوع العميل</label>
            <select value={customerType} onChange={e => setCustomerType(e.target.value as any)} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm bg-white outline-none">
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-bold mb-1">الهاتف</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-blue-400" /></div>
            <div><label className="block text-sm font-bold mb-1">المحمول</label>
              <input value={mobile} onChange={e => setMobile(e.target.value)} type="tel" className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-blue-400" /></div>
            <div className="col-span-2"><label className="block text-sm font-bold mb-1">البريد</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-blue-400" /></div>
            <div className="col-span-2"><label className="block text-sm font-bold mb-1">العنوان</label>
              <input value={address} onChange={e => setAddress(e.target.value)} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-blue-400" /></div>
            <div><label className="block text-sm font-bold mb-1">المدينة</label>
              <input value={city} onChange={e => setCity(e.target.value)} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-blue-400" /></div>
            <div><label className="block text-sm font-bold mb-1">حد الائتمان</label>
              <input type="number" value={creditLimit || ''} onChange={e => setCreditLimit(+e.target.value || 0)} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-blue-400" /></div>
            <div className="col-span-2"><label className="block text-sm font-bold mb-1">خصم افتراضي %</label>
              <input type="number" value={defaultDiscount || ''} onChange={e => setDefaultDiscount(+e.target.value || 0)} min={0} max={100} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-blue-400" /></div>
            <div className="col-span-2"><label className="block text-sm font-bold mb-1">ملاحظات</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none resize-none focus:border-blue-400" /></div>
          </div>
        </div>
        <div className="p-5 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 rounded-xl text-gray-700 font-bold hover:bg-gray-50">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50" style={{ background: 'linear-gradient(to left, #1B3A6B, #1B2E4B)' }}>
            {saving ? '⏳' : (customer ? 'حفظ' : 'إضافة')}
          </button>
        </div>
      </div>
    </div>
  )
}

// 🆕 Modal كشف الحساب الكامل
function CustomerDetailModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const [tab, setTab] = useState<'invoices' | 'payments' | 'ledger' | 'colors'>('invoices')
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [printData, setPrintData] = useState<any>(null)
  const [viewingInvoice, setViewingInvoice] = useState<any>(null)

  const { settings } = useAppStore()
  const { stats } = useCustomerStats(customer.id)
  const { data: invoices } = useCustomerInvoices(customer.id)
  const { data: payments } = useCustomerPayments(customer.id)
  const { data: ledger } = useCustomerLedger(customer.id)
  const { data: colorHistory } = useCustomerColorHistory(customer.id)

  async function handleReprint(saleId: string) {
    const result = await getInvoiceForReprint(saleId)
    if (result.success) setPrintData(result.invoice)
    else alert(`خطأ: ${result.error}`)
  }

  function exportLedgerCSV() {
    const headers = ['التاريخ', 'البيان', 'المرجع', 'مدين', 'دائن', 'الرصيد']
    const rows = ledger.map((t: any) => [
      formatDate(t.date),
      t.type === 'sale' ? 'فاتورة بيع' : t.type === 'payment' ? 'دفعة' : t.type === 'return' ? 'مرتجع' : t.type,
      t.reference_no || '-',
      t.debit.toFixed(2),
      t.credit.toFixed(2),
      t.balance.toFixed(2)
    ])
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `كشف-حساب-${customer.name}.csv`
    a.click()
  }

  const filteredInvoices = invoices.filter((inv: any) => {
    if (!invoiceSearch) return true
    const term = invoiceSearch.toLowerCase()
    return inv.invoice_no?.toLowerCase().includes(term) ||
           (inv.items as any[])?.some(i => i.product_name?.toLowerCase().includes(term))
  })

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} dir="rtl">
        <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl my-4">

          {/* Header */}
          <div className="text-white p-5 rounded-t-2xl" style={{ background: 'linear-gradient(to left, #1B2E4B, #1B3A6B)' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black" style={{ backgroundColor: '#D4AF37' }}>
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black">{customer.name}</h3>
                  <p className="text-blue-300 text-sm">{customer.phone ?? customer.mobile ?? '-'}</p>
                  <div className="flex gap-2 items-center mt-1">
                    <span className="text-[10px] text-blue-200">{customer.code}</span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{TYPE_LABELS[customer.customer_type]}</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="text-white/60 hover:text-white"><X size={22} /></button>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                <div className="bg-white/10 rounded-xl p-2.5 text-center">
                  <ShoppingBag size={14} className="mx-auto mb-1 text-blue-300" />
                  <p className="text-sm font-black">{formatCurrency(stats.totalSales)}</p>
                  <p className="text-[9px] text-blue-300">إجمالي الشراء</p>
                </div>
                <div className="bg-green-500/20 rounded-xl p-2.5 text-center">
                  <TrendingUp size={14} className="mx-auto mb-1 text-green-300" />
                  <p className="text-sm font-black">{formatCurrency(stats.totalPaid)}</p>
                  <p className="text-[9px] text-blue-300">المدفوع</p>
                </div>
                <div className={`rounded-xl p-2.5 text-center ${stats.debt > 0 ? 'bg-red-500/30' : 'bg-white/10'}`}>
                  <Wallet size={14} className="mx-auto mb-1 text-red-300" />
                  <p className="text-sm font-black">{formatCurrency(stats.debt)}</p>
                  <p className="text-[9px] text-blue-300">المتبقي</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 text-center">
                  <Receipt size={14} className="mx-auto mb-1 text-blue-300" />
                  <p className="text-sm font-black">{stats.invoicesCount}</p>
                  <p className="text-[9px] text-blue-300">عدد الفواتير</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] font-black">{stats.lastSaleDate ? formatDate(stats.lastSaleDate) : '-'}</p>
                  <p className="text-[9px] text-blue-300">آخر شراء</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] font-black">{stats.lastPaymentDate ? formatDate(stats.lastPaymentDate) : '-'}</p>
                  <p className="text-[9px] text-blue-300">آخر سداد</p>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50">
            {[
              { v: 'invoices', l: '🧾 الفواتير', count: invoices.length },
              { v: 'payments', l: '💰 المدفوعات', count: payments.length },
              { v: 'ledger', l: '📊 كشف الحساب', count: ledger.length },
              { v: 'colors', l: '🎨 الألوان', count: colorHistory.length }
            ].map(t => (
              <button key={t.v} onClick={() => setTab(t.v as any)}
                className={`flex-1 py-3 text-sm font-bold transition-all ${tab === t.v ? 'bg-white border-b-2 text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
                style={tab === t.v ? { borderColor: '#D4AF37' } : {}}>
                {t.l} <span className="text-[10px] opacity-60">({t.count})</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="max-h-[55vh] overflow-y-auto p-4">

            {/* INVOICES TAB */}
            {tab === 'invoices' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} placeholder="بحث برقم الفاتورة أو المنتج..."
                    className="w-full pr-9 pl-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-blue-400" />
                </div>

                {filteredInvoices.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Receipt size={32} className="mx-auto mb-2" />
                    <p className="text-sm">لا توجد فواتير</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100 border-b text-xs">
                          <th className="py-2.5 px-3 text-right">الفاتورة</th>
                          <th className="py-2.5 px-3 text-right">التاريخ</th>
                          <th className="py-2.5 px-3 text-right">الإجمالي</th>
                          <th className="py-2.5 px-3 text-right">المدفوع</th>
                          <th className="py-2.5 px-3 text-right">المتبقي</th>
                          <th className="py-2.5 px-3 text-center">الحالة</th>
                          <th className="py-2.5 px-3 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInvoices.map((inv: any) => {
                          const isFullyPaid = inv.remaining <= 0
                          const isPartial = inv.paid > 0 && inv.remaining > 0
                          return (
                            <React.Fragment key={inv.id}>
                              <tr className="border-b border-gray-50 hover:bg-blue-50/20">
                                <td className="py-2.5 px-3 font-mono text-xs font-bold" style={{ color: '#1B3A6B' }}>{inv.invoice_no}</td>
                                <td className="py-2.5 px-3 text-xs text-gray-500">{formatDate(inv.date)}</td>
                                <td className="py-2.5 px-3 text-xs font-black" style={{ color: '#D4AF37' }}>{formatCurrency(inv.total)}</td>
                                <td className="py-2.5 px-3 text-xs font-bold text-green-600">{formatCurrency(inv.paid)}</td>
                                <td className="py-2.5 px-3 text-xs font-bold text-red-500">{inv.remaining > 0 ? formatCurrency(inv.remaining) : '—'}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    inv.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    isFullyPaid ? 'bg-green-100 text-green-700' :
                                    isPartial ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {inv.status === 'cancelled' ? 'ملغاة' : isFullyPaid ? 'مدفوعة' : isPartial ? 'جزئية' : 'آجلة'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex gap-1 justify-center">
                                    <button onClick={() => setViewingInvoice(viewingInvoice?.id === inv.id ? null : inv)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="تفاصيل">
                                      <Eye size={13} />
                                    </button>
                                    <button onClick={() => handleReprint(inv.id)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg" title="إعادة طباعة">
                                      <Printer size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {viewingInvoice?.id === inv.id && (
                                <tr><td colSpan={7} className="bg-blue-50/30 p-4">
                                  <div className="space-y-2">
                                    {(inv.items as any[]).map((item: any) => (
                                      <div key={item.id} className="bg-white rounded-lg p-3 flex justify-between items-start">
                                        <div className="flex-1">
                                          <p className="text-sm font-bold">{item.product_name}</p>
                                          <p className="text-xs text-gray-500">
                                            {item.size_name} | {item.quantity} × {formatCurrency(item.unit_price)}
                                          </p>
                                          {item.color?.[0]?.color_code && (
                                            <p className="text-[11px] text-purple-600 mt-1">
                                              🎨 {item.color[0].color_code} - {item.color[0].color_name}
                                            </p>
                                          )}
                                        </div>
                                        <p className="text-sm font-black text-amber-600">{formatCurrency(item.total)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </td></tr>
                              )}
                            </React.Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* PAYMENTS TAB */}
            {tab === 'payments' && (
              <div>
                {payments.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Wallet size={32} className="mx-auto mb-2" />
                    <p className="text-sm">لا توجد مدفوعات</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100 border-b text-xs">
                          <th className="py-2.5 px-3 text-right">التاريخ</th>
                          <th className="py-2.5 px-3 text-right">الفاتورة</th>
                          <th className="py-2.5 px-3 text-right">المبلغ</th>
                          <th className="py-2.5 px-3 text-right">طريقة الدفع</th>
                          <th className="py-2.5 px-3 text-right">ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p: any) => (
                          <tr key={p.id} className="border-b border-gray-50">
                            <td className="py-2.5 px-3 text-xs text-gray-500">{formatDateTime(p.date)}</td>
                            <td className="py-2.5 px-3 text-xs font-mono font-bold" style={{ color: '#1B3A6B' }}>{p.sale?.invoice_no}</td>
                            <td className="py-2.5 px-3 text-sm font-black text-green-600">{formatCurrency(p.amount)}</td>
                            <td className="py-2.5 px-3 text-xs">{p.payment_method === 'cash' ? 'نقدي' : p.payment_method}</td>
                            <td className="py-2.5 px-3 text-xs text-gray-500">{p.notes ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* LEDGER TAB */}
            {tab === 'ledger' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button onClick={exportLedgerCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:opacity-90">
                    <Download size={13} /> تصدير Excel
                  </button>
                </div>
                {ledger.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <FileText size={32} className="mx-auto mb-2" />
                    <p className="text-sm">لا توجد حركات</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100 border-b text-xs">
                          <th className="py-2.5 px-3 text-right">التاريخ</th>
                          <th className="py-2.5 px-3 text-right">البيان</th>
                          <th className="py-2.5 px-3 text-right">المرجع</th>
                          <th className="py-2.5 px-3 text-center">مدين</th>
                          <th className="py-2.5 px-3 text-center">دائن</th>
                          <th className="py-2.5 px-3 text-center">الرصيد</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger.map((t: any) => (
                          <tr key={t.id} className="border-b border-gray-50">
                            <td className="py-2.5 px-3 text-xs text-gray-500">{formatDate(t.date)}</td>
                            <td className="py-2.5 px-3 text-xs font-bold">
                              {t.type === 'sale' ? '🧾 فاتورة بيع' :
                               t.type === 'payment' ? '💰 دفعة' :
                               t.type === 'return' ? '↩️ مرتجع' :
                               t.type === 'adjustment' ? '⚙️ تعديل' : t.type}
                            </td>
                            <td className="py-2.5 px-3 text-xs font-mono text-gray-500">{t.reference_no ?? '-'}</td>
                            <td className="py-2.5 px-3 text-xs text-center font-bold text-red-600">
                              {t.debit > 0 ? formatCurrency(t.debit) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-xs text-center font-bold text-green-600">
                              {t.credit > 0 ? formatCurrency(t.credit) : '-'}
                            </td>
                            <td className={`py-2.5 px-3 text-xs text-center font-black ${t.balance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                              {formatCurrency(Math.abs(t.balance))}
                              <span className="text-[9px] mr-1 text-gray-400">{t.balance > 0 ? 'له' : t.balance < 0 ? 'عليه' : ''}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* COLORS TAB */}
            {tab === 'colors' && (
              <div className="space-y-2">
                {colorHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-3xl mb-2">🎨</p>
                    <p className="text-sm">لا يوجد سجل ألوان</p>
                  </div>
                ) : colorHistory.map((h: any) => (
                  <div key={h.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <div className="w-10 h-10 rounded-xl border-2 border-white shadow flex-shrink-0" style={{ backgroundColor: h.color?.hex_value ?? '#ccc' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black">{h.color?.color_code} - {h.color?.color_name_ar ?? h.color?.color_name}</p>
                      <p className="text-[11px] text-gray-500">{h.variant?.product?.name} | {h.variant?.size_name}</p>
                      <p className="text-[10px] text-gray-400">{formatDate(h.created_at)} | {h.quantity_sold} وحدة</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {printData && (
        <PrintInvoice
          invoice={printData}
          storeName={settings?.store_name}
          storePhone={settings?.store_phone ?? undefined}
          storeAddress={settings?.store_address ?? undefined}
          taxNumber={settings?.tax_number ?? undefined}
          receiptFooter={settings?.receipt_footer}
          onClose={() => setPrintData(null)}
        />
      )}
    </>
  )
}

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null)

  const { data: customers, loading, refresh } = useCustomersList(search, typeFilter)

  async function handleDelete(c: Customer) {
    if (!confirm(`حذف "${c.name}"؟`)) return
    const r = await deleteCustomer(c.id)
    if (r.success) refresh()
    else alert(`خطأ: ${r.error}`)
  }

  const totalBalance = customers.reduce((s, c) => s + c.current_balance, 0)

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">👥 إدارة العملاء</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {customers.length} عميل
            {totalBalance !== 0 && (
              <span className={`font-bold mr-2 ${totalBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                | {totalBalance > 0 ? 'إجمالي مديونية' : 'إجمالي رصيد'}: {formatCurrency(Math.abs(totalBalance))}
              </span>
            )}
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-bold shadow-lg hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(to left, #1B3A6B, #1B2E4B)' }}>
          <Plus size={16} /> عميل جديد
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الهاتف..."
            className="w-full pr-9 pl-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-blue-400 bg-gray-50" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setTypeFilter('')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${!typeFilter ? 'text-white' : 'bg-gray-100 text-gray-600'}`} style={!typeFilter ? { backgroundColor: '#1B3A6B' } : {}}>الكل</button>
          {Object.entries(TYPE_LABELS).map(([v, l]) => (
            <button key={v} onClick={() => setTypeFilter(typeFilter === v ? '' : v)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${typeFilter === v ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} style={typeFilter === v ? { backgroundColor: '#1B3A6B' } : {}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">⏳ جاري التحميل...</div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <Users size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400 text-sm">لا يوجد عملاء</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {customers.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-400 hover:shadow-md transition-all">
              <div className="flex items-start gap-3 mb-3 cursor-pointer" onClick={() => setViewingCustomer(c)}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(135deg, #1B2E4B, #1B3A6B)' }}>
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate">{c.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${TYPE_COLORS[c.customer_type]}`}>
                    {TYPE_LABELS[c.customer_type]}
                  </span>
                </div>
              </div>
              <div className="space-y-1 mb-3">
                {(c.phone || c.mobile) && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Phone size={11} /> {c.phone ?? c.mobile}</div>}
                {c.address && <div className="flex items-center gap-1.5 text-xs text-gray-500"><MapPin size={11} /> <span className="truncate">{c.address}</span></div>}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                <div className="text-xs">
                  <p className="text-gray-400">الشراء</p>
                  <p className="font-bold">{formatCurrency(c.total_purchases)}</p>
                </div>
                {c.current_balance !== 0 && (
                  <div className="text-xs text-left">
                    <p className="text-gray-400">{c.current_balance > 0 ? 'مديونية' : 'رصيد'}</p>
                    <p className={`font-black ${c.current_balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {formatCurrency(Math.abs(c.current_balance))}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-1 mt-3 pt-2 border-t border-gray-50">
                <button onClick={() => setViewingCustomer(c)} className="flex-1 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100">
                  📊 كشف الحساب
                </button>
                <button onClick={() => setEditingCustomer(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(c)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showAddModal || editingCustomer) && (
        <CustomerModal customer={editingCustomer} onClose={() => { setShowAddModal(false); setEditingCustomer(null) }} onSaved={refresh} />
      )}

      {viewingCustomer && (
        <CustomerDetailModal customer={viewingCustomer} onClose={() => setViewingCustomer(null)} />
      )}
    </div>
  )
}
