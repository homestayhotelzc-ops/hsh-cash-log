import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

// ── provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)   // display / reporting only — never gates access
  const [loading, setLoading] = useState(true)    // true only while we don't yet know auth state

  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  // ── background profile fetch ─────────────────────────────────────────────
  // Deliberately NOT awaited before setLoading(false).
  // Profile is used only for display names / reporting — it must never block app access.
  const fetchProfileBg = useCallback(async (userId) => {
    if (!supabase || !userId) return
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (mountedRef.current) setProfile(data ?? null)
    } catch {
      // Network error or timeout — profile stays null; app still works
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    if (!isConfigured || !supabase) {
      setLoading(false)
      return
    }

    // ── Hard 5-second timeout ─────────────────────────────────────────────
    // If getSession never resolves (stale TCP after tab switch / device sleep),
    // we still clear the loading state so the app never shows an infinite spinner.
    const hardTimeout = setTimeout(() => {
      if (mountedRef.current) setLoading(false)
    }, 5_000)

    // ── Resolve initial session — the ONLY thing that gates loading ───────
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mountedRef.current) return
        clearTimeout(hardTimeout)
        const u = session?.user ?? null
        setUser(u)
        setLoading(false)
        if (u) fetchProfileBg(u.id)   // fire-and-forget — never awaited
      })
      .catch(() => {
        // getSession threw / timed out — clear loading; user=null → redirected to /login
        if (mountedRef.current) {
          clearTimeout(hardTimeout)
          setLoading(false)
        }
      })

    // ── React to auth events (sign-in, sign-out, token refresh) ──────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return
      const u = session?.user ?? null

      // Preserve object reference when the token refreshed but same user ID.
      // A new reference would cause DataContext to refetch unnecessarily.
      setUser((prev) => (prev?.id === u?.id ? prev : u))

      // Always clear loading — we now know auth state regardless of profile
      setLoading(false)

      if (u) {
        fetchProfileBg(u.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      clearTimeout(hardTimeout)
      subscription.unsubscribe()
    }
  }, [fetchProfileBg])

  async function signIn(email, password) {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    if (!supabase) return
    setProfile(null)
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
