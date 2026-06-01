export type UserRole = 'admin' | 'manager' | 'cashier' | 'warehouse'
export type CustomerType = 'retail' | 'wholesale' | 'contractor' | 'engineer' | 'company' | 'vip'
export type SaleStatus = 'draft' | 'suspended' | 'completed' | 'cancelled' | 'refunded'
export type PaymentMethod = 'cash' | 'visa' | 'mastercard' | 'vodafone_cash' | 'bank_transfer' | 'check'

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: UserRole
  avatar_url: string | null
  is_active: boolean
  pin_code: string | null
  last_login: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  name_en: string | null
  parent_id: string | null
  icon: string | null
  color_hex: string
  sort_order: number
  is_active: boolean
}

export interface Brand {
  id: string
  name: string
  logo_url: string | null
  is_active: boolean
}

export interface Product {
  id: string
  category_id: string | null
  brand_id: string | null
  name: string
  name_en: string | null
  product_code: string | null
  description: string | null
  usage_type: 'interior' | 'exterior' | 'both' | null
  finish_type: 'matt' | 'silk' | 'semi_gloss' | 'gloss' | 'satin' | null
  is_tintable: boolean
  base_types: string[] | null
  coverage_rate: number | null
  main_image_url: string | null
  is_active: boolean
  created_at: string
  category?: Category
  brand?: Brand
  variants?: ProductVariant[]
}

export interface ProductVariant {
  id: string
  product_id: string
  size_name: string
  size_value: number | null
  size_unit: string | null
  barcode: string | null
  sku: string | null
  cost_price: number
  sale_price: number
  min_stock: number
  image_url: string | null
  is_active: boolean
  product?: Product
  prices?: VariantPrice[]
  inventory?: InventoryRecord[]
}

export interface VariantPrice {
  id: string
  variant_id: string
  price_list_name: string
  price: number
  min_quantity: number
  is_active: boolean
}

export interface InventoryRecord {
  id: string
  variant_id: string
  warehouse_id: string
  quantity: number
  reserved_qty: number
  avg_cost: number
  last_purchase_price: number
  last_updated: string
}

export interface Warehouse {
  id: string
  name: string
  code: string | null
  location: string | null
  is_default: boolean
  is_active: boolean
}

export interface Color {
  id: string
  collection_id: string | null
  color_code: string
  color_name: string
  color_name_ar: string | null
  hex_value: string | null
  rgb_r: number | null
  rgb_g: number | null
  rgb_b: number | null
  lrv: number | null
  color_family: string | null
  is_popular: boolean
  is_active: boolean
  collection?: ColorCollection
}

export interface ColorCollection {
  id: string
  name: string
  year: number | null
  image_url: string | null
  is_active: boolean
}

export interface Customer {
  id: string
  customer_type: CustomerType
  code: string | null
  name: string
  phone: string | null
  mobile: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  city: string | null
  default_price_list: string
  default_discount: number
  credit_limit: number
  current_balance: number
  total_purchases: number
  notes: string | null
  is_active: boolean
  created_at: string
}

export interface CustomerProject {
  id: string
  customer_id: string
  project_name: string
  address: string | null
  area_sqm: number | null
  start_date: string | null
  end_date: string | null
  status: 'planning' | 'active' | 'completed' | 'paused' | 'cancelled'
  estimated_budget: number | null
  actual_spent: number
  notes: string | null
}

export interface Contractor {
  id: string
  type: 'contractor' | 'engineer' | 'foreman'
  code: string | null
  name: string
  phone: string | null
  commission_type: 'percentage' | 'fixed_amount' | 'per_unit' | null
  commission_value: number
  total_sales: number
  total_commissions_earned: number
  total_commissions_paid: number
  balance_due: number
  is_active: boolean
}

export interface Sale {
  id: string
  invoice_no: string
  invoice_type: 'simple' | 'tax' | 'quotation' | 'order'
  sale_type: 'cash' | 'credit' | 'mixed'
  warehouse_id: string | null
  customer_id: string | null
  contractor_id: string | null
  project_id: string | null
  date: string
  subtotal: number
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  discount_amount: number
  tax_rate: number
  tax_amount: number
  total: number
  paid: number
  remaining: number
  payment_method: string
  status: SaleStatus
  is_tax_invoice: boolean
  contractor_commission: number
  notes: string | null
  cashier_id: string | null
  created_at: string
  customer?: Customer
  contractor?: Contractor
  items?: SaleItem[]
  payments?: SalePayment[]
}

export interface SaleItem {
  id: string
  sale_id: string
  variant_id: string | null
  product_name: string
  size_name: string | null
  barcode: string | null
  quantity: number
  unit_price: number
  original_price: number | null
  discount_pct: number
  discount_amount: number
  tax_rate: number
  tax_amount: number
  subtotal: number
  total: number
  cost_price: number | null
  profit: number | null
  notes: string | null
  variant?: ProductVariant
  color?: SaleItemColor
}

export interface SaleItemColor {
  id: string
  sale_item_id: string
  color_id: string | null
  color_code: string | null
  color_name: string | null
  formula_snapshot: Record<string, number> | null
  tinting_fee: number
}

export interface SalePayment {
  id: string
  sale_id: string
  date: string
  amount: number
  payment_method: PaymentMethod
  reference_no: string | null
  notes: string | null
}

export interface Supplier {
  id: string
  code: string | null
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  payment_terms: string | null
  current_balance: number
  is_active: boolean
}

export interface Purchase {
  id: string
  po_no: string
  supplier_id: string
  warehouse_id: string | null
  date: string
  subtotal: number
  discount_amount: number
  tax_amount: number
  shipping_cost: number
  total: number
  paid: number
  remaining: number
  status: 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled'
  notes: string | null
  supplier?: Supplier
  items?: PurchaseItem[]
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  variant_id: string | null
  product_name: string
  size_name: string | null
  quantity: number
  unit_cost: number
  discount_pct: number
  total: number
}

export interface Expense {
  id: string
  expense_no: string | null
  category_id: string | null
  date: string
  amount: number
  payment_method: string
  description: string
  created_at: string
}

export interface AppSettings {
  id: string
  store_name: string
  store_phone: string | null
  store_address: string | null
  store_logo_url: string | null
  tax_number: string | null
  default_tax_rate: number
  currency: string
  currency_symbol: string
  invoice_prefix: string
  thermal_printer_width: number
  receipt_footer: string
  enable_tax: boolean
}

export interface CartItem {
  rowId: string
  variantId: string
  productName: string
  sizeName: string
  barcode: string | null
  unitPrice: number
  originalPrice: number
  costPrice: number
  quantity: number
  discountPct: number
  discountAmount: number
  taxRate: number
  taxAmount: number
  subtotal: number
  total: number
  color?: { colorId: string; colorCode: string; colorName: string; hexValue?: string }
  notes: string
}

export interface SuspendedCart {
  id: string
  label: string
  items: CartItem[]
  customerId: string | null
  customerName: string | null
  contractorId: string | null
  discountValue: number
  discountType: 'percentage' | 'fixed'
  notes: string
  createdAt: string
}

export interface DashboardStats {
  todaySales: number
  todayOrders: number
  monthSales: number
  monthProfit: number
  totalCustomers: number
  lowStockCount: number
  cashBalance: number
  pendingReceivables: number
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> }
      product_variants: { Row: ProductVariant; Insert: Partial<ProductVariant>; Update: Partial<ProductVariant> }
      variant_prices: { Row: VariantPrice; Insert: Partial<VariantPrice>; Update: Partial<VariantPrice> }
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> }
      brands: { Row: Brand; Insert: Partial<Brand>; Update: Partial<Brand> }
      inventory: { Row: InventoryRecord; Insert: Partial<InventoryRecord>; Update: Partial<InventoryRecord> }
      inventory_movements: { Row: any; Insert: any; Update: any }
      warehouses: { Row: Warehouse; Insert: Partial<Warehouse>; Update: Partial<Warehouse> }
      colors: { Row: Color; Insert: Partial<Color>; Update: Partial<Color> }
      color_collections: { Row: ColorCollection; Insert: Partial<ColorCollection>; Update: Partial<ColorCollection> }
      color_formulas: { Row: any; Insert: any; Update: any }
      customer_color_history: { Row: any; Insert: any; Update: any }
      customers: { Row: Customer; Insert: Partial<Customer>; Update: Partial<Customer> }
      customer_projects: { Row: CustomerProject; Insert: Partial<CustomerProject>; Update: Partial<CustomerProject> }
      customer_transactions: { Row: any; Insert: any; Update: any }
      contractors: { Row: Contractor; Insert: Partial<Contractor>; Update: Partial<Contractor> }
      contractor_commissions: { Row: any; Insert: any; Update: any }
      suppliers: { Row: Supplier; Insert: Partial<Supplier>; Update: Partial<Supplier> }
      sales: { Row: Sale; Insert: Partial<Sale>; Update: Partial<Sale> }
      sale_items: { Row: SaleItem; Insert: Partial<SaleItem>; Update: Partial<SaleItem> }
      sale_item_colors: { Row: SaleItemColor; Insert: Partial<SaleItemColor>; Update: Partial<SaleItemColor> }
      sale_payments: { Row: SalePayment; Insert: Partial<SalePayment>; Update: Partial<SalePayment> }
      sale_returns: { Row: any; Insert: any; Update: any }
      suspended_sales: { Row: any; Insert: any; Update: any }
      quotations: { Row: any; Insert: any; Update: any }
      purchases: { Row: Purchase; Insert: Partial<Purchase>; Update: Partial<Purchase> }
      purchase_items: { Row: PurchaseItem; Insert: Partial<PurchaseItem>; Update: Partial<PurchaseItem> }
      warehouse_transfers: { Row: any; Insert: any; Update: any }
      stock_adjustments: { Row: any; Insert: any; Update: any }
      cash_registers: { Row: any; Insert: any; Update: any }
      cash_movements: { Row: any; Insert: any; Update: any }
      expenses: { Row: Expense; Insert: Partial<Expense>; Update: Partial<Expense> }
      expense_categories: { Row: any; Insert: any; Update: any }
      revenues: { Row: any; Insert: any; Update: any }
      notifications: { Row: any; Insert: any; Update: any }
      app_settings: { Row: AppSettings; Insert: Partial<AppSettings>; Update: Partial<AppSettings> }
      product_images: { Row: any; Insert: any; Update: any }
      activity_logs: { Row: any; Insert: any; Update: any }
      quotation_items: { Row: any; Insert: any; Update: any }
      sale_return_items: { Row: any; Insert: any; Update: any }
      purchase_returns: { Row: any; Insert: any; Update: any }
      supplier_transactions: { Row: any; Insert: any; Update: any }
    }
  }
}