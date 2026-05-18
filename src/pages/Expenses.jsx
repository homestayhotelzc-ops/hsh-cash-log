import React, { useState } from 'react'
import {
  Package, Wrench, Wind, Car, Utensils, RotateCcw, MoreHorizontal, Banknote,
  Plus, Trash2, CheckCircle, AlertCircle, Clock, User, Inbox, Save,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { isConfigured } from '../lib/supabase'
import PaymentBadge from '../components/PaymentBadge'
import VoidConfirmModal from '../components/VoidConfirmModal'

// Category configuration — lucide outline icons replace emoji
const CATEGORY_CONFIG = [
  { id: 'Supplies',       icon: Package,        label: 'Supplies'     },
  { id: 'Maintenance',    icon: Wrench,          label: 'Maintenance'  },
  { id: 'Laundry',        icon: Wind,            label: 'Laundry'      },
  { id: 'Transportation', icon: Car,             label: 'Transport'    },
  { id: 'Food',           icon: Utensils,        label: 'Food'         },
  { id: 'Refund',              icon: RotateCcw,      label: 'Refund'      },
  { id: "Owner's Withdrawal", icon: Banknote,       label: 'Withdrawal'  },
  { id: 'Other',              icon: MoreHorizontal, label: 'Other'       },
]

const CATEGORY_IDS = CATEGORY_CONFIG.map((c) => c.id)
const PAYMENT_METHODS = ['Cash', 'GCash', 'Maya', 'Bank']

function fmt(n) {
  return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

function CategoryIcon({ id, size = 13, ...rest }) {
  const cfg = CATEGORY_CONFIG.find((c) => c.id === id)
  if (!cfg) return <Package size={size} {...rest} />
  const Icon = cfg.icon
  return <Icon size={size} strokeWidth={1.75} {...rest} />
}

export default function Expenses() {
  const { saveExpense, voidExpense, activeExpenses, loading, selectedDate } = useData()
  const { user, profile } = useAuth()

  const [category, setCategory] = useState('Supplies')
  const [amount, setAmount]     = useState('')
  const [method, setMethod]     = useState('Cash')
  const [notes, setNotes]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')
  const [voidTarget, setVoidTarget] = useState(null)

  async function handleSave(e) {
    e.preventDefault()
    if (!isConfigured) {
      setError('Supabase not configured. Cannot save in demo mode.')
      return
    }
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount.')
      return
    }
    setSaving(true)
    setError('')
    try {
      // staff_id / staff_name / created_by_* auto-populated by DataContext from auth
      await saveExpense({
        category,
        amount: Number(amount),
        payment_method: method,
        notes: notes.trim(),
      })
      setSaved(true)
      setAmount('')
      setNotes('')
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message ?? 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const cashExpenses    = activeExpenses.filter((e) => e.payment_method === 'Cash')
  const nonCashExpenses = activeExpenses.filter((e) => e.payment_method !== 'Cash')
  const totalCash    = cashExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalNonCash = nonCashExpenses.reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="max-w-xl mx-auto space-y-7 animate-fade-in">

      {/* ── Page heading ──────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-hotel-text dark:text-hotel-dark-text">
          Expenses
        </h1>
        <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted mt-0.5">
          Record operational costs · {selectedDate}
        </p>
      </div>

      {/* ── Quick totals ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="hotel-card p-5">
          <p className="text-[10px] font-bold text-hotel-muted dark:text-hotel-dark-muted uppercase tracking-widest">
            Cash Expenses
          </p>
          <p className="text-2xl font-bold tracking-tight text-red-500 dark:text-red-400 mt-2.5 leading-none">
            {fmt(totalCash)}
          </p>
          <p className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted mt-2">
            {cashExpenses.length} item{cashExpenses.length !== 1 ? 's' : ''} · deducted from cash
          </p>
        </div>
        <div className="hotel-card p-5">
          <p className="text-[10px] font-bold text-hotel-muted dark:text-hotel-dark-muted uppercase tracking-widest">
            Non-Cash Expenses
          </p>
          <p className="text-2xl font-bold tracking-tight text-hotel-text dark:text-hotel-dark-text mt-2.5 leading-none">
            {fmt(totalNonCash)}
          </p>
          <p className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted mt-2">
            {nonCashExpenses.length} item{nonCashExpenses.length !== 1 ? 's' : ''} · logged only
          </p>
        </div>
      </div>

      {/* ── Add expense form ──────────────────────────────────── */}
      <form onSubmit={handleSave} className="hotel-card p-6 space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-hotel-border dark:border-hotel-dark-border">
          <div className="w-7 h-7 rounded-lg bg-hotel-surface dark:bg-hotel-dark-surface border border-hotel-border dark:border-hotel-dark-border flex items-center justify-center">
            <Plus size={13} strokeWidth={2} className="text-hotel-accent dark:text-hotel-dark-accent" />
          </div>
          <h2 className="font-semibold text-sm text-hotel-text dark:text-hotel-dark-text">
            New Expense
          </h2>
        </div>

        {/* Category chips */}
        <div>
          <label className="hotel-label">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_CONFIG.map(({ id, icon: Icon, label }) => {
              const active = category === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCategory(id)}
                  className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl font-medium transition-all duration-150 ${
                    active
                      ? 'bg-hotel-accent text-white shadow-sm'
                      : 'bg-hotel-surface dark:bg-hotel-dark-surface text-hotel-muted dark:text-hotel-dark-muted hover:bg-hotel-border dark:hover:bg-hotel-dark-border border border-hotel-border dark:border-hotel-dark-border'
                  }`}
                >
                  <Icon size={12} strokeWidth={active ? 2 : 1.75} />
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Amount + method */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="hotel-label">Amount (₱)</label>
            <input
              type="number"
              className="hotel-input"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError('') }}
              required
            />
          </div>
          <div>
            <label className="hotel-label">Payment</label>
            <select
              className="hotel-select"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Logged-in staff indicator */}
        {(profile?.full_name ?? user?.email) && (() => {
          const name = profile?.full_name ?? user?.email ?? ''
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

        {/* Notes */}
        <div>
          <label className="hotel-label">Notes <span className="normal-case font-normal text-hotel-muted dark:text-hotel-dark-muted">(optional)</span></label>
          <input
            className="hotel-input"
            placeholder="Brief description of this expense"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Cash impact hint */}
        <div className="flex items-center gap-2.5 text-xs text-hotel-muted dark:text-hotel-dark-muted bg-hotel-surface dark:bg-hotel-dark-surface border border-hotel-border dark:border-hotel-dark-border rounded-xl px-4 py-3">
          <PaymentBadge method={method} size="xs" />
          <span className="leading-relaxed">
            {method === 'Cash'
              ? 'Will deduct from cash on hand'
              : 'Logged in expense totals only — no cash impact'}
          </span>
        </div>

        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl px-4 py-3">
            <AlertCircle size={13} strokeWidth={1.75} /> {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl px-4 py-3">
            <CheckCircle size={13} strokeWidth={1.75} /> Expense saved successfully
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Save size={14} strokeWidth={2} />
          {saving ? 'Saving…' : 'Save Expense'}
        </button>
      </form>

      {/* ── Expense list ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-hotel-text dark:text-hotel-dark-text">
              Today's Expenses
            </h2>
            <p className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted mt-0.5">
              {activeExpenses.length} recorded
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="hotel-card p-5 animate-pulse h-20" />
            ))}
          </div>
        ) : activeExpenses.length === 0 ? (
          <div className="hotel-card p-12 flex flex-col items-center gap-3 text-center">
            <Inbox size={26} strokeWidth={1.5} className="text-hotel-border dark:text-hotel-dark-border" />
            <p className="text-sm text-hotel-muted dark:text-hotel-dark-muted">
              No expenses recorded yet
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeExpenses.map((exp) => (
              <div
                key={exp.id}
                className="hotel-card p-4 flex items-start justify-between gap-4 hover:shadow-hotel-md dark:hover:shadow-hotel-dark-md transition-all duration-200"
              >
                {/* Icon */}
                <div className="shrink-0 w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 flex items-center justify-center">
                  <CategoryIcon id={exp.category} size={14} className="text-red-500 dark:text-red-400" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-hotel-text dark:text-hotel-dark-text">
                      {exp.category}
                    </span>
                    <PaymentBadge method={exp.payment_method} size="xs" />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-hotel-muted dark:text-hotel-dark-muted flex-wrap">
                    {exp.staff_name && (
                      <span className="flex items-center gap-1">
                        <User size={10} strokeWidth={1.75} /> {exp.staff_name}
                      </span>
                    )}
                    {exp.created_at && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} strokeWidth={1.75} />
                        {format(parseISO(exp.created_at), 'h:mm a')}
                      </span>
                    )}
                  </div>
                  {exp.notes && (
                    <p className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted italic line-clamp-1">
                      "{exp.notes}"
                    </p>
                  )}
                </div>

                {/* Amount + void */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-sm font-bold text-red-500 dark:text-red-400">
                    −{fmt(exp.amount)}
                  </span>
                  <button
                    onClick={() => setVoidTarget(exp)}
                    className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={11} strokeWidth={1.75} /> Void
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Void confirm ──────────────────────────────────────── */}
      {voidTarget && (
        <VoidConfirmModal
          item={voidTarget}
          type="expense"
          onConfirm={async () => {
            await voidExpense(voidTarget)
            setVoidTarget(null)
          }}
          onClose={() => setVoidTarget(null)}
        />
      )}
    </div>
  )
}
