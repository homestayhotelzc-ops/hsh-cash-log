import React, { useState } from 'react'
import {
  Wallet, TrendingUp, CreditCard, DollarSign,
  Users, Lock, Unlock, Save,
  CheckCircle, AlertTriangle, Clock, Trash2, Hash,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useData, computeEntryDisplay } from '../contexts/DataContext'
import { isConfigured } from '../lib/supabase'
import PaymentBadge from '../components/PaymentBadge'

const UNLOCK_PASSWORD = 'bugU'

function fmt(n) {
  return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

function SummaryRow({ label, value, highlight, positive, negative, bold }) {
  const valClass = positive
    ? 'text-emerald-600 dark:text-emerald-400'
    : negative
    ? 'text-red-600 dark:text-red-400'
    : highlight
    ? 'text-hotel-accent dark:text-hotel-dark-accent'
    : 'text-hotel-text dark:text-hotel-dark-text'

  return (
    <div className={`flex items-center justify-between py-2.5 border-b border-hotel-border dark:border-hotel-dark-border last:border-0 ${bold ? 'font-semibold' : ''}`}>
      <span className="text-sm text-hotel-muted dark:text-hotel-dark-muted">{label}</span>
      <span className={`text-sm ${valClass} ${bold ? 'font-bold' : ''}`}>{value}</span>
    </div>
  )
}

export default function Summary() {
  const {
    totals, openingCashRecord, activeEntries, activeExpenses,
    voidedEntries, voidedExpenses, staff, selectedDate,
    saveOpeningCash, unlockOpeningCash,
  } = useData()

  // Opening cash state
  const [openingInput, setOpeningInput] = useState('')
  const [savingOpening, setSavingOpening] = useState(false)
  const [openingError, setOpeningError] = useState('')

  // Unlock state
  const [showUnlock, setShowUnlock] = useState(false)
  const [unlockPw, setUnlockPw] = useState('')
  const [unlockError, setUnlockError] = useState('')

  // Cash count
  const [actualCash, setActualCash] = useState('')

  // Staff tab
  const [activeStaffId, setActiveStaffId] = useState(null)

  const locked = openingCashRecord?.locked ?? false

  async function handleSaveOpening() {
    if (!isConfigured) { setOpeningError('Supabase not configured.'); return }
    const amt = Number(openingInput)
    if (isNaN(amt) || amt < 0) { setOpeningError('Please enter a valid amount.'); return }
    setSavingOpening(true)
    setOpeningError('')
    try {
      await saveOpeningCash(amt)
    } catch (err) {
      setOpeningError(err.message ?? 'Failed to save.')
    } finally {
      setSavingOpening(false)
    }
  }

  async function handleUnlock(e) {
    e.preventDefault()
    if (unlockPw !== UNLOCK_PASSWORD) {
      setUnlockError('Incorrect password.')
      return
    }
    try {
      await unlockOpeningCash()
      setShowUnlock(false)
      setUnlockPw('')
      setUnlockError('')
    } catch (err) {
      setUnlockError(err.message ?? 'Failed to unlock.')
    }
  }

  const diff = actualCash !== '' ? Number(actualCash) - totals.endingCash : null
  const isBalanced = diff !== null && Math.abs(diff) < 0.01

  // Staff entries breakdown
  const staffEntries = staff.map((s) => ({
    ...s,
    entries: activeEntries.filter((e) => e.staff_id === s.id),
  }))

  const selectedStaffEntries = activeStaffId
    ? activeEntries.filter((e) => e.staff_id === activeStaffId)
    : []

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-hotel-text dark:text-hotel-dark-text">Summary</h1>
        <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted mt-0.5">
          Shift closing panel · {selectedDate}
        </p>
      </div>

      {/* ── Opening Cash ─────────────────────────────── */}
      <section className="hotel-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-heading flex items-center gap-2">
            <Wallet size={15} className="text-hotel-accent dark:text-hotel-dark-accent" />
            Start of Day — Opening Cash
          </h2>
          {locked && (
            <button
              onClick={() => setShowUnlock(true)}
              className="flex items-center gap-1.5 text-xs text-hotel-muted dark:text-hotel-dark-muted hover:text-hotel-accent dark:hover:text-hotel-dark-accent transition-colors"
            >
              <Unlock size={13} /> Edit
            </button>
          )}
        </div>
        <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted -mt-2">
          Input once at the start of the cash day (12:00 AM onwards).
        </p>

        {locked ? (
          <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3">
            <Lock size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Opening Cash Locked — {fmt(openingCashRecord?.amount ?? 0)}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                Opening Cash Locked for This Date
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="hotel-label">Opening Cash Amount (₱)</label>
              <input
                type="number"
                className="hotel-input"
                placeholder={openingCashRecord ? String(openingCashRecord.amount) : '0.00'}
                min="0"
                step="0.01"
                value={openingInput}
                onChange={(e) => { setOpeningInput(e.target.value); setOpeningError('') }}
              />
            </div>
            {openingError && (
              <p className="text-xs text-red-600 dark:text-red-400">{openingError}</p>
            )}
            <button
              onClick={handleSaveOpening}
              disabled={savingOpening}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={14} />
              {savingOpening ? 'Saving…' : 'Save Opening Cash'}
            </button>
          </div>
        )}

        {/* Unlock modal inline */}
        {showUnlock && (
          <form onSubmit={handleUnlock} className="space-y-3 border-t border-hotel-border dark:border-hotel-dark-border pt-4">
            <p className="text-xs font-semibold text-hotel-muted dark:text-hotel-dark-muted">
              Enter manager password to unlock:
            </p>
            <input
              type="password"
              className="hotel-input"
              placeholder="Password"
              value={unlockPw}
              onChange={(e) => { setUnlockPw(e.target.value); setUnlockError('') }}
              autoFocus
            />
            {unlockError && (
              <p className="text-xs text-red-600 dark:text-red-400">{unlockError}</p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowUnlock(false); setUnlockPw(''); setUnlockError('') }} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1">Unlock</button>
            </div>
          </form>
        )}
      </section>

      {/* ── Cash Summary ──────────────────────────────── */}
      <section className="hotel-card p-5">
        <h2 className="section-heading flex items-center gap-2 mb-4">
          <TrendingUp size={15} strokeWidth={1.75} className="text-hotel-accent dark:text-hotel-dark-accent" />
          Cash Summary
        </h2>
        <div>
          <SummaryRow label="Opening Cash"            value={fmt(totals.opening)}      highlight />
          <SummaryRow label="＋ Cash In"               value={fmt(totals.cashIn)}       positive />
          <SummaryRow label="－ Cash Out / Adjustments" value={fmt(totals.cashOut)}    negative={totals.cashOut > 0} />
          <SummaryRow label="－ Cash Expenses"         value={fmt(totals.cashExpenses)} negative={totals.cashExpenses > 0} />
        </div>
        {/* Expected Ending Cash — prominent result */}
        <div className={`mt-4 pt-4 border-t-2 flex items-center justify-between ${
          totals.endingCash >= 0
            ? 'border-emerald-200 dark:border-emerald-800/40'
            : 'border-red-200 dark:border-red-800/40'
        }`}>
          <span className="text-sm font-semibold text-hotel-text dark:text-hotel-dark-text">
            Expected Ending Cash
          </span>
          <span className={`text-2xl font-bold tracking-tight ${
            totals.endingCash >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {fmt(totals.endingCash)}
          </span>
        </div>
      </section>

      {/* ── Non-Cash Summary ──────────────────────────── */}
      <section className="hotel-card p-5">
        <h2 className="section-heading flex items-center gap-2 mb-4">
          <CreditCard size={15} strokeWidth={1.75} className="text-hotel-accent dark:text-hotel-dark-accent" />
          Non-Cash Summary
        </h2>
        <div>
          <SummaryRow label="GCash"         value={fmt(totals.gcash)} />
          <SummaryRow label="Maya"          value={fmt(totals.maya)}  />
          <SummaryRow label="Bank Transfer" value={fmt(totals.bank)}  />
        </div>
        <div className="mt-4 pt-4 border-t border-hotel-border dark:border-hotel-dark-border flex items-center justify-between">
          <span className="text-sm font-semibold text-hotel-text dark:text-hotel-dark-text">
            Total Non-Cash
          </span>
          <span className="text-lg font-bold text-hotel-text dark:text-hotel-dark-text">
            {fmt(totals.nonCash)}
          </span>
        </div>
      </section>

      {/* ── Activity Summary ──────────────────────────── */}
      <section className="hotel-card p-5">
        <h2 className="section-heading flex items-center gap-2 mb-4">
          <Hash size={15} strokeWidth={1.75} className="text-hotel-accent dark:text-hotel-dark-accent" />
          Activity Summary
        </h2>
        <SummaryRow
          label="Total Active Entries"
          value={`${totals.entryCount} entr${totals.entryCount !== 1 ? 'ies' : 'y'}`}
          positive={totals.entryCount > 0}
        />
        <SummaryRow
          label="Total Voided Transactions"
          value={String(voidedEntries.length + voidedExpenses.length)}
          negative={(voidedEntries.length + voidedExpenses.length) > 0}
        />
        <SummaryRow
          label="Total Expenses"
          value={`${totals.expenseCount} item${totals.expenseCount !== 1 ? 's' : ''} · ${fmt(totals.totalExpenses)}`}
          negative={totals.totalExpenses > 0}
        />
      </section>

      {/* ── Cash Count Check ──────────────────────────── */}
      <section className="hotel-card p-5 space-y-4">
        <h2 className="section-heading flex items-center gap-2">
          <DollarSign size={15} className="text-hotel-accent dark:text-hotel-dark-accent" />
          Cash Count Check
        </h2>
        <div>
          <label className="hotel-label">Actual Cash Counted (₱)</label>
          <input
            type="number"
            className="hotel-input"
            placeholder="Enter physical count"
            min="0"
            step="0.01"
            value={actualCash}
            onChange={(e) => setActualCash(e.target.value)}
          />
        </div>
        {actualCash !== '' && (
          <div className="space-y-2 bg-hotel-surface dark:bg-hotel-dark-surface rounded-xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-hotel-muted dark:text-hotel-dark-muted">Expected Cash</span>
              <span className="font-medium text-hotel-text dark:text-hotel-dark-text">{fmt(totals.endingCash)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-hotel-muted dark:text-hotel-dark-muted">Actual Cash</span>
              <span className="font-medium text-hotel-text dark:text-hotel-dark-text">{fmt(Number(actualCash))}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-hotel-border dark:border-hotel-dark-border pt-2">
              <span className="font-semibold text-hotel-text dark:text-hotel-dark-text">Difference</span>
              {isBalanced ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle size={14} /> Balanced
                </span>
              ) : (
                <span className={`flex items-center gap-1.5 font-bold ${diff && diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  <AlertTriangle size={14} />
                  {diff && diff > 0 ? '+' : ''}{fmt(diff ?? 0)}
                  {diff && diff < 0 ? ' short' : diff && diff > 0 ? ' over' : ''}
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Staff Entries ─────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="section-heading flex items-center gap-2">
          <Users size={15} className="text-hotel-accent dark:text-hotel-dark-accent" />
          Staff Entries
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {staffEntries.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveStaffId(activeStaffId === s.id ? null : s.id)}
              className={`hotel-card p-4 text-left transition-all ${
                activeStaffId === s.id ? 'ring-2 ring-hotel-accent dark:ring-hotel-dark-accent' : ''
              }`}
            >
              <p className="font-semibold text-sm text-hotel-text dark:text-hotel-dark-text truncate">{s.name}</p>
              <p className="text-2xl font-bold text-hotel-accent dark:text-hotel-dark-accent mt-1">
                {s.entries.length}
              </p>
              <p className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted">
                entr{s.entries.length !== 1 ? 'ies' : 'y'} today
              </p>
            </button>
          ))}
        </div>

        {activeStaffId && selectedStaffEntries.length > 0 && (
          <div className="hotel-card p-4 space-y-3 animate-slide-up">
            <p className="text-xs font-semibold text-hotel-muted dark:text-hotel-dark-muted uppercase tracking-wider">
              {staff.find((s) => s.id === activeStaffId)?.name}'s Entries
            </p>
            {selectedStaffEntries.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b border-hotel-border dark:border-hotel-dark-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-hotel-text dark:text-hotel-dark-text">{e.guest_name}</p>
                  <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted flex items-center gap-1 mt-0.5">
                    <Clock size={10} />
                    {e.created_at ? format(parseISO(e.created_at), 'h:mm a') : '—'}
                  </p>
                </div>
                {(() => {
                  const { totalAmount, netCashImpact, nonCash, cashIn, cashOut } = computeEntryDisplay(e)
                  const isPureNonCash = cashIn === 0 && cashOut === 0 && nonCash > 0
                  return (
                    <div className="text-right">
                      <span className={`text-sm font-bold ${
                        isPureNonCash
                          ? 'text-hotel-text dark:text-hotel-dark-text'
                          : netCashImpact > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : netCashImpact < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-hotel-muted dark:text-hotel-dark-muted'
                      }`}>
                        {isPureNonCash
                          ? fmt(totalAmount)
                          : `${netCashImpact > 0 ? '+' : ''}${fmt(netCashImpact)}`}
                      </span>
                      {nonCash > 0 && (
                        <p className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted">
                          {fmt(nonCash)} non-cash
                        </p>
                      )}
                    </div>
                  )
                })()}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Void History ─────────────────────────────── */}
      {(voidedEntries.length > 0 || voidedExpenses.length > 0) && (
        <section className="space-y-3">
          <h2 className="section-heading flex items-center gap-2">
            <Trash2 size={15} className="text-red-500" />
            Void History
          </h2>

          {voidedEntries.length > 0 && (
            <div className="hotel-card p-4 space-y-2">
              <p className="text-xs font-semibold text-hotel-muted dark:text-hotel-dark-muted uppercase tracking-wider mb-3">
                Voided Transactions
              </p>
              {voidedEntries.map((v) => {
                const data = v.entry_data ?? {}
                const { totalAmount } = computeEntryDisplay(data)
                return (
                  <div key={v.id} className="flex items-start gap-3 py-2.5 border-b border-hotel-border dark:border-hotel-dark-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-hotel-text dark:text-hotel-dark-text truncate">
                          {data.guest_name ?? 'Unknown'}
                        </span>
                        <PaymentBadge method="VOIDED" voided size="xs" />
                      </div>
                      <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted mt-0.5 flex items-center gap-1">
                        <Clock size={10} />
                        {v.voided_at ? format(parseISO(v.voided_at), 'MMM d, h:mm a') : '—'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400 shrink-0">
                      {fmt(totalAmount)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {voidedExpenses.length > 0 && (
            <div className="hotel-card p-4 space-y-2">
              <p className="text-xs font-semibold text-hotel-muted dark:text-hotel-dark-muted uppercase tracking-wider mb-3">
                Voided Expenses
              </p>
              {voidedExpenses.map((v) => {
                const data = v.expense_data ?? {}
                return (
                  <div key={v.id} className="flex items-start gap-3 py-2.5 border-b border-hotel-border dark:border-hotel-dark-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-hotel-text dark:text-hotel-dark-text">
                          {data.category ?? 'Expense'}
                        </span>
                        <PaymentBadge method="VOIDED" voided size="xs" />
                      </div>
                      <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted mt-0.5 flex items-center gap-1">
                        <Clock size={10} />
                        {v.voided_at ? format(parseISO(v.voided_at), 'MMM d, h:mm a') : '—'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400 shrink-0">
                      {fmt(data.amount ?? 0)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
