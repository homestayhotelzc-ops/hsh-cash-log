import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { RefreshCw, LogOut, ShieldOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

/**
 * Route guard — checks only whether the user is authenticated.
 * Role / profile checks have been removed; access control is managed
 * by disabling/deleting the Supabase Auth account instead.
 *
 * Includes a 5-second hard fallback so a stale network can never
 * produce an infinite spinner.
 */
export default function RequireAuth({ children }) {
  const { user, loading, signOut } = useAuth()
  const [timedOut, setTimedOut] = useState(false)

  // Start a 5-second countdown whenever loading is true.
  // Reset immediately if loading clears on its own.
  useEffect(() => {
    if (!loading) {
      setTimedOut(false)
      return
    }
    const t = setTimeout(() => setTimedOut(true), 5_000)
    return () => clearTimeout(t)
  }, [loading])

  // ── Still loading ─────────────────────────────────────────────────────────
  if (loading) {
    if (timedOut) {
      // Shown after 5 s — user is never permanently stuck
      return (
        <div className="min-h-screen bg-hotel-bg dark:bg-hotel-dark-bg flex items-center justify-center px-6">
          <div className="hotel-card p-8 max-w-sm w-full flex flex-col items-center gap-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <RefreshCw size={22} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-hotel-text dark:text-hotel-dark-text text-sm">
                Connection is taking too long
              </p>
              <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted mt-1 leading-relaxed">
                The server didn't respond. This usually happens after switching
                tabs or waking the device. Try refreshing first.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                Retry
              </button>
              <button
                onClick={async () => {
                  try { await signOut() } catch { /* ignore */ }
                  window.location.href = '/login'
                }}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <LogOut size={14} />
                Log out
              </button>
              <button
                onClick={() => {
                  // Clear all Supabase session keys from localStorage then go to login
                  try {
                    Object.keys(localStorage)
                      .filter((k) => k.startsWith('sb-'))
                      .forEach((k) => localStorage.removeItem(k))
                  } catch { /* ignore */ }
                  window.location.href = '/login'
                }}
                className="text-xs text-hotel-muted dark:text-hotel-dark-muted underline underline-offset-2 hover:text-red-500 transition-colors mt-1"
              >
                <ShieldOff size={12} className="inline mr-1" />
                Clear session &amp; log out
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Normal spinner — shown for up to 5 s
    return (
      <div className="min-h-screen bg-hotel-bg dark:bg-hotel-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-hotel-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted">Loading…</p>
        </div>
      </div>
    )
  }

  // ── Auth resolved ─────────────────────────────────────────────────────────
  if (!user) return <Navigate to="/login" replace />

  return children
}
