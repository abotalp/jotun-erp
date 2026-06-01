import { useState, useEffect } from 'react'
import { db } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'

export function useSettingsManagement() {
  const { settings, setSettings } = useAppStore()
  const [form, setForm] = useState<any>(settings ?? {})
  const [saving, setSaving] = useState(false)

  useEffect(() => { setForm(settings ?? {}) }, [settings])

  async function save() {
    if (!form.id) return { success: false, error: 'No settings id' }
    setSaving(true)
    const { error } = await db.app_settings().update(form).eq('id', form.id)
    setSaving(false)
    if (error) return { success: false, error: error.message }
    setSettings(form as any)
    return { success: true }
  }

  return { form, setForm, save, saving }
}

export function useUsersList() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    db.profiles().select('*').order('full_name').then(({ data }) => setData(data ?? []))
  }, [])

  return data
}

export function useWarehousesList() {
  const [data, setData] = useState<any[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    db.warehouses().select('*').eq('is_active', true).then(({ data }) => setData(data ?? []))
  }, [refreshKey])

  return { data, refresh: () => setRefreshKey(k => k + 1) }
}

export async function addWarehouse(name: string, code: string, location: string) {
  const { error } = await db.warehouses().insert({ name, code, location, is_active: true, is_default: false })
  return error ? { success: false, error: error.message } : { success: true }
}