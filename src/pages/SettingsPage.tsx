import React, { useState } from 'react'
import { useSettingsManagement, useUsersList, useWarehousesList, addWarehouse } from '@/hooks/useSettings'
import { Save, Plus, Building, Printer, Shield, Database } from 'lucide-react'

export default function SettingsPage() {
  const [tab, setTab] = useState<'store'|'print'|'users'|'warehouse'>('store')
  const { form, setForm, save, saving } = useSettingsManagement()
  const users = useUsersList()
  const { data: warehouses, refresh: refreshWh } = useWarehousesList()

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

  async function handleSave() {
    const r = await save()
    if (r.success) alert('✅ تم الحفظ بنجاح')
    else alert(`❌ ${r.error}`)
  }

  async function handleAddWh() {
    const name = prompt('اسم المخزن:')
    const code = prompt('كود المخزن:')
    const location = prompt('الموقع:') ?? ''
    if (name && code) {
      const r = await addWarehouse(name, code, location)
      if (r.success) refreshWh()
      else alert(r.error)
    }
  }

  const TABS = [
    { v: 'store', l: 'بيانات المعرض', icon: Building },
    { v: 'print', l: 'الطباعة', icon: Printer },
    { v: 'users', l: 'المستخدمون', icon: Shield },
    { v: 'warehouse', l: 'المخازن', icon: Database }
  ]

  return (
    <div className="space-y-4" dir="rtl">
      <h1 className="text-2xl font-black text-gray-900">⚙️ الإعدادات</h1>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.v} onClick={() => setTab(t.v as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === t.v ? 'text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            style={tab === t.v ? { backgroundColor: '#1B3A6B' } : {}}>
            <t.icon size={15} /> {t.l}
          </button>
        ))}
      </div>

      {tab === 'store' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h3 className="text-base font-black text-gray-800">بيانات المعرض</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { k: 'store_name', l: 'اسم المعرض' },
              { k: 'store_phone', l: 'الهاتف' },
              { k: 'store_address', l: 'العنوان', span: 2 },
              { k: 'tax_number', l: 'الرقم الضريبي' },
              { k: 'invoice_prefix', l: 'بادئة الفاتورة' },
              { k: 'receipt_footer', l: 'تذييل الفاتورة', span: 2 }
            ].map(f => (
              <div key={f.k} className={f.span === 2 ? 'col-span-2' : ''}>
                <label className="block text-sm font-bold text-gray-700 mb-1">{f.l}</label>
                <input value={form?.[f.k] ?? ''} onChange={e => set(f.k, e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">نسبة الضريبة %</label>
              <input type="number" value={form?.default_tax_rate ?? 14}
                onChange={e => set('default_tax_rate', +e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
            </div>
            <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
              <input type="checkbox" id="enableTax" checked={form?.enable_tax ?? true}
                onChange={e => set('enable_tax', e.target.checked)} className="w-4 h-4 accent-blue-600" />
              <label htmlFor="enableTax" className="text-sm font-bold text-blue-800">تفعيل الضريبة</label>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-white font-bold rounded-xl hover:opacity-90 shadow-lg disabled:opacity-50"
            style={{ background: 'linear-gradient(to left, #D4AF37, #B8960C)' }}>
            <Save size={16} /> {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      )}

      {tab === 'print' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h3 className="text-base font-black">إعدادات الطباعة</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">عرض الطابعة الحرارية</label>
              <select value={form?.thermal_printer_width ?? 80} onChange={e => set('thermal_printer_width', +e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white outline-none">
                <option value={58}>58mm</option>
                <option value={80}>80mm</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">العملة</label>
              <input value={form?.currency_symbol ?? 'ج.م'} onChange={e => set('currency_symbol', e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none" />
            </div>
          </div>
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 text-white font-bold rounded-xl"
            style={{ background: 'linear-gradient(to left, #1B3A6B, #1B2E4B)' }}>
            <Save size={16} /> حفظ
          </button>
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="text-base font-black">المستخدمون</h3>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b">{['الاسم','الدور','آخر دخول','الحالة'].map(h => <th key={h} className="py-3 px-4 text-right text-xs font-bold text-gray-600">{h}</th>)}</tr></thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-b border-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: '#1B3A6B' }}>{u.full_name.charAt(0)}</div>
                      <span className="text-sm font-bold">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4"><span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'manager' ? 'bg-blue-100 text-blue-700' : u.role === 'cashier' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.role === 'admin' ? 'مدير النظام' : u.role === 'manager' ? 'مدير' : u.role === 'cashier' ? 'كاشير' : 'مخزن'}
                  </span></td>
                  <td className="py-3 px-4 text-xs text-gray-400">{u.last_login ? new Date(u.last_login).toLocaleDateString('ar-EG') : '-'}</td>
                  <td className="py-3 px-4"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.is_active ? 'نشط' : 'غير نشط'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-amber-50 border-t border-amber-100">
            <p className="text-xs text-amber-700">⚠️ لإضافة مستخدم جديد، اذهب إلى Supabase Dashboard → Authentication → Users</p>
          </div>
        </div>
      )}

      {tab === 'warehouse' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-base font-black">المخازن</h3>
            <button onClick={handleAddWh} className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-xl text-xs font-bold hover:opacity-90"
              style={{ backgroundColor: '#1B3A6B' }}>
              <Plus size={13} /> إضافة مخزن
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {warehouses.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-black">{w.name}</p>
                  <p className="text-xs text-gray-500">{w.code} | {w.location}</p>
                </div>
                <div className="flex gap-2">
                  {w.is_default && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#D4AF37', color: 'white' }}>افتراضي</span>}
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">نشط</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}