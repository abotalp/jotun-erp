import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import type { Profile, AppSettings, Warehouse } from '@/types/database'

let authInitialized = false
let cachedProfile: Profile | null = null
let cachedSettings: AppSettings | null = null
let cachedWarehouse: Warehouse | null = null

export function useAuth() {
  const { user, setUser, setSettings, setActiveWarehouse } = useAppStore()
  const [loading, setLoading] = useState(!authInitialized)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    // إذا تم التهيئة من قبل، استخدم القيم المحفوظة
    if (authInitialized) {
      if (cachedProfile) setUser(cachedProfile)
      if (cachedSettings) setSettings(cachedSettings)
      if (cachedWarehouse) setActiveWarehouse(cachedWarehouse)
      setLoading(false)
      return
    }

    let subscription: { unsubscribe: () => void } | null = null

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user && mountedRef.current) {
          await loadAllData(session.user.id)
        }

        authInitialized = true
        if (mountedRef.current) setLoading(false)
      } catch (e) {
        console.error('Auth init error:', e)
        if (mountedRef.current) setLoading(false)
      }

      // الاستماع للتغييرات (مرة واحدة فقط)
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mountedRef.current) return

        if (event === 'SIGNED_IN' && session?.user) {
          await loadAllData(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          cachedProfile = null
          cachedSettings = null
          cachedWarehouse = null
          setUser(null)
        }
      })
      subscription = data.subscription
    }

    async function loadAllData(userId: string) {
      try {
        // جلب كل البيانات في parallel (مرة واحدة فقط)
        const [profileRes, settingsRes, warehouseRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.from('app_settings').select('*').single(),
          supabase.from('warehouses').select('*').eq('is_default', true).single()
        ])

        if (!mountedRef.current) return

        if (profileRes.data) {
          cachedProfile = profileRes.data as Profile
          setUser(cachedProfile)
        }

        if (settingsRes.data) {
          cachedSettings = settingsRes.data as AppSettings
          setSettings(cachedSettings)
        }

        if (warehouseRes.data) {
          cachedWarehouse = warehouseRes.data as Warehouse
          setActiveWarehouse(cachedWarehouse)
        }

        // تحديث last_login بدون انتظار
        supabase.from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userId)
          .then(() => {})
      } catch (e) {
        console.error('Load data error:', e)
      }
    }

    init()

    return () => {
      mountedRef.current = false
      subscription?.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    cachedProfile = null
    cachedSettings = null
    cachedWarehouse = null
    authInitialized = false
    await supabase.auth.signOut()
    setUser(null)
  }

  return { user, loading, signIn, signOut }
}
