import React, { useState } from 'react'
import { AlertTriangle, X, Lock } from 'lucide-react'

const VOID_PASSWORD = 'bugU'

export default function VoidConfirmModal({ item, type = 'entry', onConfirm, onClose }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const label = type === 'entry' ? 'transaction entry' : 'expense'

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== VOID_PASSWORD) {
      setError('Incorrect password. Please try again.')
      return
    }
    setLoading(true)
    try {
      await onConfirm()
    } catch (err) {
      setError(err.message ?? 'Failed to void. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      style={{ background: 'rgba(26,18,9,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div className="hotel-card w-full max-w-sm modal-content">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4 border-b border-hotel-border dark:border-hotel-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
              <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-hotel-text dark:text-hotel-dark-text">
                Void {type === 'entry' ? 'Entry' : 'Expense'}
              </h3>
              <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted mt-0.5">
                This action cannot be undone easily
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="bg-hotel-surface dark:bg-hotel-dark-surface rounded-xl p-3 text-sm text-hotel-muted dark:text-hotel-dark-muted">
            You are about to void this {label}. It will be moved to the void history and removed from all totals.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="hotel-label flex items-center gap-1.5">
                <Lock size={11} /> Manager Password
              </label>
              <input
                type="password"
                className="hotel-input"
                placeholder="Enter password to confirm"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                autoFocus
              />
              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">{error}</p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !password}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Voiding…' : 'Confirm Void'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
