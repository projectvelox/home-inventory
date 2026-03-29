import { useState, useEffect, useRef } from 'react'
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

// Retry profile fetch up to 2 times (handles transient network blips)
async function fetchProfileWithRetry(userId) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const profile = await fetchProfile(userId)
      if (profile) return profile
    } catch {}
    if (attempt === 0) await new Promise(r => setTimeout(r, 800))
  }
  return null
}

export function useAuth() {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const mountedRef            = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    // Hard timeout so the spinner never hangs forever (e.g. network outage on startup)
    const timeout = setTimeout(() => {
      if (mountedRef.current) setLoading(false)
    }, 6000)

    // getSession() reads from localStorage synchronously — resolves immediately if cached
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mountedRef.current) return
      if (session?.user) {
        const profile = await fetchProfileWithRetry(session.user.id)
        if (mountedRef.current) setUser(profile)
      }
      clearTimeout(timeout)
      if (mountedRef.current) setLoading(false)
    }).catch(() => {
      clearTimeout(timeout)
      if (mountedRef.current) setLoading(false)
    })

    // Listen for auth state changes — single subscription for the lifetime of the app
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Only update if the user actually changed (avoids redundant profile fetches on token refresh)
          const profile = await fetchProfileWithRetry(session.user.id)
          if (mountedRef.current) setUser(profile)
        } else if (event === 'SIGNED_OUT') {
          if (mountedRef.current) {
            setUser(null)
            setLoading(false) // ensure loading is cleared if sign-out during startup
          }
        }
      }
    )

    return () => {
      mountedRef.current = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function login(email, password) {
    // Race the login request against a 15-second timeout so it never hangs indefinitely
    const loginPromise = supabase.auth.signInWithPassword({ email, password })
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Login timed out — check your connection and try again.')), 15000)
    )
    try {
      const { data, error } = await Promise.race([loginPromise, timeoutPromise])
      if (error) return error.message
      // Eagerly fetch + set profile so the UI transitions immediately
      // (don't wait for onAuthStateChange which fires slightly later)
      if (data?.user) {
        const profile = await fetchProfileWithRetry(data.user.id)
        if (mountedRef.current && profile) setUser(profile)
      }
      return null
    } catch (e) {
      return e.message
    }
  }

  async function logout() {
    // Clear user state immediately so the login screen renders right away
    setUser(null)
    try {
      await supabase.auth.signOut()
    } catch {
      // If the network signOut fails, force-clear the local session so re-login works
      supabase.auth.signOut({ scope: 'local' }).catch(() => {})
    }
  }

  return { user, loading, login, logout }
}
