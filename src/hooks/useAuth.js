import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

async function fetchProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (!data) return null
  // Normalize snake_case DB fields to camelCase for consistent usage throughout the app
  return {
    ...data,
    displayName: data.display_name ?? data.displayName ?? 'User',
    avatar:      data.avatar ?? '👤',
    role:        data.role ?? 'helper',
  }
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Hard timeout so the spinner never hangs forever
    const timeout = setTimeout(() => setLoading(false), 6000)

    // Resolve immediately from the existing session instead of waiting for the event
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setUser(profile)
      }
      clearTimeout(timeout)
      setLoading(false)
    }).catch(() => { clearTimeout(timeout); setLoading(false) })

    // Keep listening for sign-in / sign-out / token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const profile = await fetchProfile(session.user.id)
          setUser(profile)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return { user, loading, login, logout }
}
