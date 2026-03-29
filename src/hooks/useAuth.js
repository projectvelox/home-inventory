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

// Build a minimal user object from the JWT user_metadata when the DB is unavailable
function profileFromSession(session) {
  const meta = session?.user?.user_metadata ?? {}
  const rawAvatar = meta.avatar ?? ''
  // Reject garbage avatar values like "??" — use fallback emoji instead
  const avatar = rawAvatar && !rawAvatar.includes('?') ? rawAvatar : '👤'
  return {
    id:          session.user.id,
    displayName: meta.display_name ?? 'User',
    avatar,
    role:        meta.role ?? 'helper',
  }
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
        if (mountedRef.current) setUser(profile ?? profileFromSession(session))
      }
      clearTimeout(timeout)
      if (mountedRef.current) setLoading(false)
    }).catch(() => {
      clearTimeout(timeout)
      if (mountedRef.current) setLoading(false)
    })

    // Single subscription for the lifetime of the app
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Fetch full profile; fall back to JWT metadata so a slow DB never logs the user out
          const profile = await fetchProfileWithRetry(session.user.id)
          if (mountedRef.current) setUser(profile ?? profileFromSession(session))
        } else if (event === 'SIGNED_OUT') {
          if (mountedRef.current) {
            setUser(null)
            setLoading(false)
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
    // Trim whitespace/newlines — env vars can carry trailing \n which causes invalid_credentials
    const cleanEmail    = (email    ?? '').trim()
    const cleanPassword = (password ?? '').trim()

    // Race signInWithPassword against a 15-second timeout
    const loginPromise = supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword })
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Login timed out — check your connection and try again.')), 15000)
    )
    try {
      const { error } = await Promise.race([loginPromise, timeoutPromise])
      if (error) return error.message
      // Profile will be set by the onAuthStateChange SIGNED_IN handler above —
      // returning null immediately lets the LoginScreen stop spinning right away
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
      // If network signOut fails, force-clear the local session so re-login works
      supabase.auth.signOut({ scope: 'local' }).catch(() => {})
    }
  }

  return { user, loading, login, logout }
}
