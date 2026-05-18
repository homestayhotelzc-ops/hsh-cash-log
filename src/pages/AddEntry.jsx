import React, { useState } from 'react'
import {
  User, Home, CreditCard, FileText, Plus, Trash2,
  CheckCircle, ChevronRight, ChevronLeft, AlertCircle,
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { isConfigured } from '../lib/supabase'
import PaymentBadge from '../components/PaymentBadge'

const ROOM_TYPES = ['Casa Clara', 'Casa Grande', 'Casa Doble', 'Other']
const CATEGORIES = [
  'Room Payment', 'Reservation DP', 'Security Deposit', 'Extension',
  'Early Check-in Fee', 'Late Check-out Fee', 'Extra Pax', 'Cashbox Adjustment', 'Other',
]
const PAYMENT_METHODS = ['Cash', 'GCash', 'Maya', 'Bank']

function fmt(n) {
  return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

function calcTotal(transactions) {
  return transactions.reduce((s, t) => s + (Number(t.amount) || 0), 0)
}

const STEPS = [
  { id: 1, label: 'Guest Info',  icon: User       },
  { id: 2, label: 'Rooms',       icon: Home       },
  { id: 3, label: 'Payments',    icon: CreditCard  },
  { id: 4, label: 'Notes',       icon: FileText   },
]

export default function AddEntry() {
  const { saveEntry, selectedDate } = useData()
  const { user, profile } = useAuth()

  const [step, setStep] = useState(1)
  const [guestName, setGuestName] = useState('')
  const [rooms, setRooms] = useState([{ type: 'Casa Clara' }])
  const [transactions, setTransactions] = useState([
    { category: 'Room Payment', amount: '', payment_method: 'Cash' },
  ])
  const [notes,   setNotes]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  // ── rooms helpers ──────────────────────────────────────
  function addRoom() { setRooms((r) => [...r, { type: 'Casa Clara' }]) }
  function removeRoom(i) { setRooms((r) => r.filter((_, idx) => idx !== i)) }
  function updateRoom(i, field, val) {
    setRooms((r) => r.map((rm, idx) => (idx === i ? { ...rm, [field]: val } : rm)))
  }

  // ── transaction helpers ────────────────────────────────
  function addTx() {
    setTransactions((t) => [...t, { category: 'Room Payment', amount: '', payment_method: 'Cash' }])
  }
  function removeTx(i) { setTransactions((t) => t.filter((_, idx) => idx !== i)) }
  function updateTx(i, field, val) {
    setTransactions((t) => t.map((tx, idx) => (idx === i ? { ...tx, [field]: val } : tx)))
  }

  // ── validation ─────────────────────────────────────────
  function canProceed() {
    if (step === 1) return guestName.trim().length > 0
    if (step === 2) return rooms.length > 0
    if (step === 3) return transactions.length > 0 && transactions.every((t) => Number(t.amount) > 0)
    return true
  }

  // ── save ───────────────────────────────────────────────
  async function handleSave() {
    if (!isConfigured) {
      setError('Supabase is not configured. Cannot save data in demo mode.')
      return
    }
    setSaving(true)
    setError('')
    try {
      // staff_id / staff_name / created_by_* are auto-populated by DataContext from auth
      await saveEntry({
        guest_name:   guestName.trim(),
        rooms,
        transactions: transactions.map((t) => ({ ...t, amount: Number(t.amount) })),
        notes:        notes.trim(),
      })
      setSaved(true)
      setTimeout(() => {
        setStep(1)
        setGuestName('')
        setRooms([{ type: 'Casa Clara' }])
        setTransactions([{ category: 'Room Payment', amount: '', payment_method: 'Cash' }])
        setNotes('')
        setSaved(false)
      }, 2000)
    } catch (err) {
      setError(err.message ?? 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const total = calcTotal(transactions)

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-hotel-text dark:text-hotel-dark-text">Entry Saved!</h2>
        <p className="text-sm text-hotel-muted dark:text-hotel-dark-muted">
          {guestName} — {fmt(total)}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in pb-24">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-hotel-text dark:text-hotel-dark-text">Add Entry</h1>
        <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted mt-0.5">
          Guest / company transaction · {selectedDate}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const Icon  = s.icon
          const done   = step > s.id
          const active = step === s.id
          return (
            <React.Fragment key={s.id}>
              <button
                onClick={() => done && setStep(s.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? 'bg-hotel-accent text-white shadow-hotel'
                    : done
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 cursor-pointer'
                    : 'bg-hotel-surface dark:bg-hotel-dark-surface text-hotel-muted dark:text-hotel-dark-muted cursor-default'
                }`}
              >
                <Icon size={12} />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${done ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-hotel-border dark:bg-hotel-dark-border'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* ── Step 1: Guest Info ──────────────────────────────── */}
      {step === 1 && (
        <div className="hotel-card p-5 space-y-4 animate-slide-up">
          <h2 className="section-heading flex items-center gap-2">
            <User size={15} className="text-hotel-accent dark:text-hotel-dark-accent" />
            Guest Info
          </h2>

          <div>
            <label className="hotel-label">Guest / Company Name *</label>
            <input
              className="hotel-input"
              placeholder="e.g. Juan dela Cruz, ABC Corp"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Logged-in staff indicator */}
          {(profile || user) && (() => {
            const name = profile?.full_name ?? user?.email ?? ''
            if (!name) return null
            return (
              <div className="flex items-center gap-2 text-xs text-hotel-muted dark:text-hotel-dark-muted bg-hotel-surface dark:bg-hotel-dark-surface border border-hotel-border dark:border-hotel-dark-border rounded-xl px-4 py-2.5">
                <div className="w-5 h-5 rounded-lg bg-hotel-accent flex items-center justify-center shrink-0">
                  <span className="text-white text-[9px] font-bold leading-none">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span>
                  Logged as{' '}
                  <span className="font-semibold text-hotel-text dark:text-hotel-dark-text">
                    {name}
                  </span>
                </span>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Step 2: Rooms ───────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-3 animate-slide-up">
          <div className="hotel-card p-5 space-y-3">
            <h2 className="section-heading flex items-center gap-2">
              <Home size={15} className="text-hotel-accent dark:text-hotel-dark-accent" />
              Rooms
            </h2>
            {rooms.map((room, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  className="hotel-select flex-1"
                  value={room.type}
                  onChange={(e) => updateRoom(i, 'type', e.target.value)}
                >
                  {ROOM_TYPES.map((rt) => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </select>
                {rooms.length > 1 && (
                  <button
                    onClick={() => removeRoom(i)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addRoom} className="btn-secondary w-full flex items-center justify-center gap-1.5 text-xs">
              <Plus size={13} /> Add Room
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Payments ────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-3 animate-slide-up">
          <div className="hotel-card p-5 space-y-4">
            <h2 className="section-heading flex items-center gap-2">
              <CreditCard size={15} className="text-hotel-accent dark:text-hotel-dark-accent" />
              Payments
            </h2>
            {transactions.map((tx, i) => (
              <div key={i} className="space-y-2 p-3 rounded-xl bg-hotel-surface dark:bg-hotel-dark-surface border border-hotel-border dark:border-hotel-dark-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-hotel-muted dark:text-hotel-dark-muted">
                    Payment {i + 1}
                  </span>
                  {transactions.length > 1 && (
                    <button
                      onClick={() => removeTx(i)}
                      className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <div>
                  <label className="hotel-label">Category</label>
                  <select
                    className="hotel-select"
                    value={tx.category}
                    onChange={(e) => updateTx(i, 'category', e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="hotel-label">Amount (₱)</label>
                    <input
                      type="number"
                      className="hotel-input"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={tx.amount}
                      onChange={(e) => updateTx(i, 'amount', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="hotel-label">Method</label>
                    <select
                      className="hotel-select"
                      value={tx.payment_method}
                      onChange={(e) => updateTx(i, 'payment_method', e.target.value)}
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-0.5">
                  <PaymentBadge method={tx.payment_method} size="xs" />
                  {tx.payment_method === 'Cash' ? (
                    <span className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted">
                      {tx.category === 'Cashbox Adjustment' ? '→ Cash Out' : '→ Cash In'}
                    </span>
                  ) : (
                    <span className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted">
                      → Non-Cash (no cash impact)
                    </span>
                  )}
                </div>
              </div>
            ))}
            <button onClick={addTx} className="btn-secondary w-full flex items-center justify-center gap-1.5 text-xs">
              <Plus size={13} /> Add Payment Row
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Notes + summary ─────────────────────────── */}
      {step === 4 && (
        <div className="hotel-card p-5 space-y-4 animate-slide-up">
          <h2 className="section-heading flex items-center gap-2">
            <FileText size={15} className="text-hotel-accent dark:text-hotel-dark-accent" />
            Notes
          </h2>

          <div>
            <label className="hotel-label">Additional Notes <span className="normal-case font-normal text-hotel-muted dark:text-hotel-dark-muted">(optional)</span></label>
            <textarea
              className="hotel-input resize-none"
              rows={4}
              placeholder="Special requests, remarks, early check-in details…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Entry summary preview */}
          <div className="bg-hotel-surface dark:bg-hotel-dark-surface rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-hotel-muted dark:text-hotel-dark-muted uppercase tracking-wider">
              Entry Summary
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-hotel-muted dark:text-hotel-dark-muted">Guest</span>
              <span className="font-medium text-hotel-text dark:text-hotel-dark-text">{guestName}</span>
            </div>
            {(profile?.full_name ?? user?.email) && (
              <div className="flex justify-between text-sm">
                <span className="text-hotel-muted dark:text-hotel-dark-muted">Staff</span>
                <span className="text-hotel-text dark:text-hotel-dark-text">
                  {profile?.full_name ?? user?.email}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-hotel-muted dark:text-hotel-dark-muted">Rooms</span>
              <span className="text-hotel-text dark:text-hotel-dark-text">{rooms.map((r) => r.type).join(', ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-hotel-muted dark:text-hotel-dark-muted">Payments</span>
              <span className="text-hotel-text dark:text-hotel-dark-text">{transactions.length} row(s)</span>
            </div>
            <div className="flex justify-between text-sm border-t border-hotel-border dark:border-hotel-dark-border pt-2 mt-1">
              <span className="font-semibold text-hotel-text dark:text-hotel-dark-text">Total</span>
              <span className="font-bold text-hotel-accent dark:text-hotel-dark-accent">{fmt(total)}</span>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}

      {/* Nav + sticky save bar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:static bg-hotel-bg/95 dark:bg-hotel-dark-bg/95 backdrop-blur-md md:backdrop-blur-none border-t border-hotel-border dark:border-hotel-dark-border md:border-0 p-4 md:p-0">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="btn-secondary flex items-center gap-1.5"
            >
              <ChevronLeft size={15} /> Back
            </button>
          )}

          <div className="flex-1">
            {step < 4 ? (
              <button
                onClick={() => canProceed() && setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="btn-primary w-full flex items-center justify-center gap-1.5"
              >
                Next <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {saving ? 'Saving…' : `Save Entry · ${fmt(total)}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
