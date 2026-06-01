import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import type { Profile, AppSettings, CartItem, SuspendedCart, Warehouse } from '@/types/database'

interface AuthSlice {
  user: Profile | null
  settings: AppSettings | null
  activeWarehouse: Warehouse | null
  setUser: (user: Profile | null) => void
  setSettings: (s: AppSettings) => void
  setActiveWarehouse: (w: Warehouse) => void
}

interface PosSlice {
  cart: CartItem[]
  customerId: string | null
  customerName: string | null
  contractorId: string | null
  projectId: string | null
  discountType: 'percentage' | 'fixed'
  discountValue: number
  paymentMethod: string
  saleNotes: string
  isTaxInvoice: boolean
  suspendedCarts: SuspendedCart[]

  addToCart: (item: CartItem) => void
  removeFromCart: (rowId: string) => void
  updateCartItem: (rowId: string, updates: Partial<CartItem>) => void
  clearCart: () => void

  setCustomer: (id: string | null, name: string | null) => void
  setContractor: (id: string | null) => void
  setProject: (id: string | null) => void
  setDiscount: (type: 'percentage' | 'fixed', value: number) => void
  setPaymentMethod: (m: string) => void
  setSaleNotes: (n: string) => void
  toggleTaxInvoice: () => void

  suspendCart: (label: string) => void
  resumeCart: (id: string) => void
  deleteSuspended: (id: string) => void

  cartTotals: () => {
    itemCount: number
    subtotal: number
    discountAmount: number
    taxAmount: number
    total: number
    profit: number
  }
}

interface UiSlice {
  sidebarOpen: boolean
  activeModule: string
  setSidebarOpen: (v: boolean) => void
  setActiveModule: (m: string) => void
}

type AppStore = AuthSlice & PosSlice & UiSlice

function calcRow(item: CartItem): CartItem {
  const discountAmt = item.originalPrice * item.quantity * (item.discountPct / 100)
  const subtotal = item.originalPrice * item.quantity - discountAmt
  const taxAmt = subtotal * (item.taxRate / 100)
  const total = subtotal + taxAmt
  return {
    ...item,
    unitPrice: item.originalPrice * (1 - item.discountPct / 100),
    discountAmount: discountAmt,
    subtotal,
    taxAmount: taxAmt,
    total
  }
}

function makeSuspended(state: PosSlice, label: string): SuspendedCart {
  return {
    id: crypto.randomUUID(),
    label,
    items: [...state.cart],
    customerId: state.customerId,
    customerName: state.customerName,
    contractorId: state.contractorId,
    discountValue: state.discountValue,
    discountType: state.discountType,
    notes: state.saleNotes,
    createdAt: new Date().toISOString()
  }
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        settings: null,
        activeWarehouse: null,
        setUser: (user) => set({ user }),
        setSettings: (settings) => set({ settings }),
        setActiveWarehouse: (w) => set({ activeWarehouse: w }),

        cart: [],
        customerId: null,
        customerName: null,
        contractorId: null,
        projectId: null,
        discountType: 'percentage',
        discountValue: 0,
        paymentMethod: 'cash',
        saleNotes: '',
        isTaxInvoice: false,
        suspendedCarts: [],

        addToCart: (item) =>
          set(s => ({ cart: [...s.cart, calcRow(item)] })),

        removeFromCart: (rowId) =>
          set(s => ({ cart: s.cart.filter(i => i.rowId !== rowId) })),

        updateCartItem: (rowId, updates) =>
          set(s => ({
            cart: s.cart.map(i =>
              i.rowId === rowId ? calcRow({ ...i, ...updates }) : i
            )
          })),

        clearCart: () =>
          set({
            cart: [], customerId: null, customerName: null,
            contractorId: null, projectId: null,
            discountValue: 0, discountType: 'percentage',
            paymentMethod: 'cash', saleNotes: '', isTaxInvoice: false
          }),

        setCustomer: (id, name) => set({ customerId: id, customerName: name }),
        setContractor: (id) => set({ contractorId: id }),
        setProject: (id) => set({ projectId: id }),
        setDiscount: (type, value) => set({ discountType: type, discountValue: value }),
        setPaymentMethod: (m) => set({ paymentMethod: m }),
        setSaleNotes: (n) => set({ saleNotes: n }),
        toggleTaxInvoice: () => set(s => ({ isTaxInvoice: !s.isTaxInvoice })),

        suspendCart: (label) =>
          set(s => ({
            suspendedCarts: [...s.suspendedCarts, makeSuspended(s, label)],
            cart: [], customerId: null, customerName: null,
            contractorId: null, discountValue: 0
          })),

        resumeCart: (id) =>
          set(s => {
            const found = s.suspendedCarts.find(c => c.id === id)
            if (!found) return {}
            return {
              cart: found.items,
              customerId: found.customerId,
              customerName: found.customerName,
              contractorId: found.contractorId,
              discountValue: found.discountValue,
              discountType: found.discountType,
              saleNotes: found.notes,
              suspendedCarts: s.suspendedCarts.filter(c => c.id !== id)
            }
          }),

        deleteSuspended: (id) =>
          set(s => ({ suspendedCarts: s.suspendedCarts.filter(c => c.id !== id) })),

        cartTotals: () => {
          const { cart, discountType, discountValue, isTaxInvoice, settings } = get()
          const itemsSubtotal = cart.reduce((a, i) => a + i.subtotal, 0)
          const itemsTax = cart.reduce((a, i) => a + i.taxAmount, 0)
          const profit = cart.reduce((a, i) => a + (i.subtotal - i.costPrice * i.quantity), 0)

          let discountAmount = 0
          if (discountType === 'percentage') discountAmount = itemsSubtotal * (discountValue / 100)
          else discountAmount = discountValue

          const afterDiscount = itemsSubtotal - discountAmount
          const taxRate = isTaxInvoice ? (settings?.default_tax_rate ?? 14) : 0
          const extraTax = afterDiscount * (taxRate / 100)
          const total = afterDiscount + itemsTax + extraTax

          return {
            itemCount: cart.reduce((a, i) => a + i.quantity, 0),
            subtotal: itemsSubtotal,
            discountAmount,
            taxAmount: itemsTax + extraTax,
            total,
            profit
          }
        },

        sidebarOpen: true,
        activeModule: 'dashboard',
        setSidebarOpen: (v) => set({ sidebarOpen: v }),
        setActiveModule: (m) => set({ activeModule: m })
      }),
      {
        name: 'jotun-erp-store',
        partialize: (s) => ({
          cart: s.cart,
          customerId: s.customerId,
          customerName: s.customerName,
          suspendedCarts: s.suspendedCarts,
          activeWarehouse: s.activeWarehouse,
          sidebarOpen: s.sidebarOpen
        })
      }
    ),
    { name: 'JotunERP' }
  )
)