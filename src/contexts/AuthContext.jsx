import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Keep a ref so async fetchProfile calls can be cancelled if the user changes
  const mountedRef = useRef(true)
  useEffect(() => { return () => { mountedRef.current = false } }, [])

  async function fetchProfile(userId) {
    if (!supabase || !userId) return null
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    return data ?? null
  }

  useEffect(() => {
    if (!isConfigured || !supabase) {
      setLoading(false)
      return
    }

    // Restore session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      if (!mountedRef.current) return
      setUser(u)
      if (u) {
        const p = await fetchProfile(u.id)
        if (mountedRef.current) setProfile(p)
      }
      setLoading(false)
    })

    // Listen for sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const u = session?.user ?? null
        if (!mountedRef.current) return
        setUser(u)
        if (u) {
          const p = await fetchProfile(u.id)
          if (mountedRef.current) setProfile(p)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  const isManager      = profile?.role === 'manager'
  const isFrontDesk    = profile?.role === 'front_desk'
  const isHousekeeping = profile?.role === 'housekeeping'

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signOut,
      isManager,
      isFrontDesk,
      isHousekeeping,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
