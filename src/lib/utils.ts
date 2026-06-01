import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'ج.م'): string {
  return `${(+amount).toLocaleString('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ${currency}`
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString('ar-EG', options ?? {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function generateRowId(): string {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function generateCode(prefix: string, num: number, pad = 5): string {
  return `${prefix}-${String(num).padStart(pad, '0')}`
}

export function calcDiscountAmount(subtotal: number, type: 'percentage' | 'fixed', value: number): number {
  if (type === 'percentage') return subtotal * (value / 100)
  return Math.min(value, subtotal)
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function parseBarcode(raw: string): string {
  return raw.trim().replace(/\s+/g, '')
}

export function getStockStatus(qty: number, min: number): 'ok' | 'low' | 'out' {
  if (qty <= 0) return 'out'
  if (qty <= min) return 'low'
  return 'ok'
}