import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import type { Profile, AppSettings, Warehouse } from '@/types/database'

export function useAuth() {
  const { user, setUser, setSettings, setActiveWarehouse } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      if (session?.user) {
        await loadProfile(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (event === 'SIGNED_IN' && session?.user) {
          await loadProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function loadProfile(userId: string) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profile) {
        setUser(profile as Profile)
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userId)
      }

      const { data: settings } = await supabase
        .from('app_settings')
        .select('*')
        .single()
      if (settings) setSettings(settings as AppSettings)

      const { data: warehouse } = await supabase
        .from('warehouses')
        .select('*')
        .eq('is_default', true)
        .single()
      if (warehouse) setActiveWarehouse(warehouse as Warehouse)
    } catch (e) {
      console.error('Load profile error:', e)
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return { user, loading, signIn, signOut }
}