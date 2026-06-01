import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Missing Supabase env vars: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'jotun-erp-auth'
  },
  realtime: {
    params: { eventsPerSecond: 10 }
  }
})

// Typed helpers for tables
export const db = {
  profiles: () => supabase.from('profiles'),
  app_settings: () => supabase.from('app_settings'),
  categories: () => supabase.from('categories'),
  brands: () => supabase.from('brands'),
  products: () => supabase.from('products'),
  product_variants: () => supabase.from('product_variants'),
  product_images: () => supabase.from('product_images'),
  variant_prices: () => supabase.from('variant_prices'),
  warehouses: () => supabase.from('warehouses'),
  inventory: () => supabase.from('inventory'),
  inventory_movements: () => supabase.from('inventory_movements'),
  colors: () => supabase.from('colors'),
  color_collections: () => supabase.from('color_collections'),
  color_formulas: () => supabase.from('color_formulas'),
  customers: () => supabase.from('customers'),
  customer_projects: () => supabase.from('customer_projects'),
  customer_transactions: () => supabase.from('customer_transactions'),
  customer_color_history: () => supabase.from('customer_color_history'),
  contractors: () => supabase.from('contractors'),
  contractor_commissions: () => supabase.from('contractor_commissions'),
  suppliers: () => supabase.from('suppliers'),
  supplier_transactions: () => supabase.from('supplier_transactions'),
  sales: () => supabase.from('sales'),
  sale_items: () => supabase.from('sale_items'),
  sale_item_colors: () => supabase.from('sale_item_colors'),
  sale_payments: () => supabase.from('sale_payments'),
  sale_returns: () => supabase.from('sale_returns'),
  suspended_sales: () => supabase.from('suspended_sales'),
  quotations: () => supabase.from('quotations'),
  quotation_items: () => supabase.from('quotation_items'),
  purchases: () => supabase.from('purchases'),
  purchase_items: () => supabase.from('purchase_items'),
  purchase_returns: () => supabase.from('purchase_returns'),
  cash_registers: () => supabase.from('cash_registers'),
  cash_movements: () => supabase.from('cash_movements'),
  expense_categories: () => supabase.from('expense_categories'),
  expenses: () => supabase.from('expenses'),
  revenues: () => supabase.from('revenues'),
  notifications: () => supabase.from('notifications'),
  activity_logs: () => supabase.from('activity_logs')
}

// RPC helpers
export const rpc = {
  nextInvoiceNumber: (prefix = 'INV') =>
    supabase.rpc('next_invoice_number', { prefix }),

  nextPoNumber: (prefix = 'PO') =>
    supabase.rpc('next_po_number', { prefix }),

  deductInventoryForSale: (saleId: string) =>
    supabase.rpc('deduct_inventory_for_sale', { sale_id: saleId }),

  updateInventoryFromPurchase: (purchaseId: string) =>
    supabase.rpc('update_inventory_from_purchase', { purchase_id: purchaseId }),

  updateCustomerBalance: (customerId: string, amount: number, type: string, refId?: string, refNo?: string) =>
    supabase.rpc('update_customer_balance', {
      p_customer_id: customerId,
      p_amount: amount,
      p_type: type,
      p_reference_id: refId ?? null,
      p_reference_no: refNo ?? null
    }),

  getDashboardStats: () =>
    supabase.rpc('get_dashboard_stats')
}

// Storage helpers
export const storage = {
  async uploadProductImage(file: File, productId: string): Promise<string | null> {
    try {
      const ext = file.name.split('.').pop()
      const path = `products/${productId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('images').getPublicUrl(path)
      return data.publicUrl
    } catch (e) {
      console.error('Upload error:', e)
      return null
    }
  },

  async uploadLogo(file: File): Promise<string | null> {
    try {
      const ext = file.name.split('.').pop()
      const path = `logos/store-logo.${ext}`
      const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('images').getPublicUrl(path)
      return data.publicUrl
    } catch (e) {
      console.error('Upload error:', e)
      return null
    }
  }
}

// Connection test
export async function testConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('app_settings').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}