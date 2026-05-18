import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { isConfigured } from '../lib/supabase'

export default function Login() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  // Redirect once authenticated
  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isConfigured) {
      setError('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await signIn(email.trim(), password)
      // Navigation is handled by the useEffect above
    } catch (err) {
      setError(err.message ?? 'Login failed. Please check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-hotel-bg dark:bg-hotel-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 rounded-2xl bg-hotel-accent flex items-center justify-center shadow-hotel-md">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <div>
            <p className="text-sm font-bold text-hotel-text dark:text-hotel-dark-text leading-tight">
              Home Stay Hotel
            </p>
            <p className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted">
              Cash Log System
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="hotel-card p-6 space-y-5">
          <div>
            <h1 className="text-lg font-bold text-hotel-text dark:text-hotel-dark-text">
              Sign in
            </h1>
            <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted mt-0.5">
              Use your staff account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="hotel-label">Email</label>
              <input
                type="email"
                className="hotel-input"
                placeholder="you@homestay.ph"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                required
                autoFocus
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="hotel-label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="hotel-input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-hotel-muted dark:text-hotel-dark-muted hover:text-hotel-text dark:hover:text-hotel-dark-text transition-colors"
                  tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl px-4 py-3">
                <AlertCircle size={13} strokeWidth={1.75} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <LogIn size={14} strokeWidth={2} />
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-hotel-muted dark:text-hotel-dark-muted mt-6">
          Contact your manager to create or reset your account.
        </p>
      </div>
    </div>
  )
}
