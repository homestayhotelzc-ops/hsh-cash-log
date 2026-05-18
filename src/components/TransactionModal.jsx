import React, { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { X, Trash2, User, Calendar, Home, FileText, Hash, ShoppingBag, Receipt } from 'lucide-react'
import PaymentBadge from './PaymentBadge'
import VoidConfirmModal from './VoidConfirmModal'
import { useData } from '../contexts/DataContext'

function fmt(n) {
  return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

function safeArray(v) {
  if (Array.isArray(v)) return v
  try { return JSON.parse(v) } catch { return [] }
}

function Row({ label, value, className = '' }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-hotel-border dark:border-hotel-dark-border last:border-0">
      <span className="text-xs text-hotel-muted dark:text-hotel-dark-muted font-medium shrink-0">
        {label}
      </span>
      <span className={`text-sm text-right ${className || 'text-hotel-text dark:text-hotel-dark-text'}`}>
        {value}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Expense detail view
// ─────────────────────────────────────────────────────────────────
function ExpenseModal({ expense, onClose }) {
  const { voidExpense } = useData()
  const [showVoid, setShowVoid] = useState(false)
  const isVoided = expense.status === 'voided'
  const isCash = expense.payment_method === 'Cash'
  const cashImpact = isCash ? -Number(expense.amount || 0) : 0

  const ICONS = {
    Supplies: '🧹', Maintenance: '🔧', Laundry: '👕',
    Transportation: '🚗', Food: '🍱', Refund: '↩️',
    "Owner's Withdrawal": '💸', Other: '📦',
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center p-4 modal-backdrop"
        style={{ background: 'rgba(26,18,9,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <div
          className="hotel-card w-full max-w-md max-h-[90vh] overflow-y-auto modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-hotel-card dark:bg-hotel-dark-card z-10 flex items-center justify-between p-5 pb-4 border-b border-hotel-border dark:border-hotel-dark-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100/80 dark:bg-red-900/30 flex items-center justify-center text-lg">
                {ICONS[expense.category] ?? '📦'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-hotel-text dark:text-hotel-dark-text">
                    {expense.category}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40">
                    {isVoided ? 'VOIDED' : 'EXPENSE'}
                  </span>
                </div>
                <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted mt-0.5 flex items-center gap-1">
                  <Hash size={10} />
                  {expense.id?.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isVoided && (
                <button
                  onClick={() => setShowVoid(true)}
                  className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 size={13} /> Void
                </button>
              )}
              <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <div className="bg-hotel-surface dark:bg-hotel-dark-surface rounded-xl p-4">
              <Row label="Amount" value={fmt(expense.amount)} />
              <Row
                label="Payment"
                value={<PaymentBadge method={expense.payment_method} size="xs" />}
              />
              {expense.staff_name && (
                <Row
                  label="Staff"
                  value={
                    <span className="flex items-center gap-1 justify-end">
                      <User size={12} />{expense.staff_name}
                    </span>
                  }
                />
              )}
              <Row
                label="Date"
                value={
                  <span className="flex items-center gap-1 justify-end">
                    <Calendar size={12} />{expense.date}
                  </span>
                }
              />
              {expense.created_at && (
                <Row
                  label="Created"
                  value={format(parseISO(expense.created_at), 'MMM d, yyyy h:mm a')}
                />
              )}
              {expense.notes && (
                <Row
                  label="Notes"
                  value={
                    <span className="flex items-center gap-1 justify-end italic">
                      <FileText size={12} />{expense.notes}
                    </span>
                  }
                />
              )}
              <Row
                label="Status"
                value={isVoided ? 'VOIDED' : 'Active'}
                className={isVoided ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}
              />
            </div>

            {/* Cash Impact */}
            <div className="bg-hotel-surface dark:bg-hotel-dark-surface rounded-xl p-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-hotel-text dark:text-hotel-dark-text">Net Cash Impact</span>
                <span className={`font-bold ${cashImpact < 0 ? 'text-red-600 dark:text-red-400' : 'text-hotel-muted dark:text-hotel-dark-muted'}`}>
                  {isCash ? `−${fmt(expense.amount)}` : '₱0.00 (no cash impact)'}
                </span>
              </div>
              {!isCash && (
                <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted">
                  Non-cash expense — logged in totals only
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showVoid && (
        <VoidConfirmModal
          item={expense}
          type="expense"
          onConfirm={async () => {
            await voidExpense(expense)
            setShowVoid(false)
            onClose()
          }}
          onClose={() => setShowVoid(false)}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Entry detail view (original, unchanged logic)
// ─────────────────────────────────────────────────────────────────
function EntryModal({ entry, onClose }) {
  const { voidEntry } = useData()
  const [showVoid, setShowVoid] = useState(false)
  const transactions = safeArray(entry.transactions)
  const rooms = safeArray(entry.rooms)
  const isVoided = entry.status === 'voided'

  // Compute totals from the transactions array — never rely on stored fields
  let _ci = 0, _co = 0, _nc = 0
  transactions.forEach((t) => {
    const amt = Number(t.amount) || 0
    if (t.payment_method === 'Cash') {
      if (t.category === 'Cashbox Adjustment') _co += amt
      else _ci += amt
    } else _nc += amt
  })
  const cashImpact = _ci - _co
  // Revenue = cashIn + nonCash. Cashbox Adjustments (cashOut) are movements, not revenue.
  const computedTotal = _ci + _nc
  const computedNonCash = _nc

  const impactClass =
    cashImpact > 0
      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
      : cashImpact < 0
      ? 'text-red-600 dark:text-red-400 font-bold'
      : 'text-hotel-muted dark:text-hotel-dark-muted font-bold'

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center p-4 modal-backdrop"
        style={{ background: 'rgba(26,18,9,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <div
          className="hotel-card w-full max-w-lg max-h-[90vh] overflow-y-auto modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-hotel-card dark:bg-hotel-dark-card z-10 flex items-center justify-between p-5 pb-4 border-b border-hotel-border dark:border-hotel-dark-border">
            <div>
              <div className="flex items-center gap-2">
                <Receipt size={14} className="text-hotel-accent dark:text-hotel-dark-accent" />
                <h3 className="font-semibold text-hotel-text dark:text-hotel-dark-text">
                  {entry.guest_name}
                </h3>
                {isVoided && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40">
                    VOIDED
                  </span>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-hotel-surface dark:bg-hotel-dark-surface text-hotel-muted dark:text-hotel-dark-muted border border-hotel-border dark:border-hotel-dark-border">
                  ENTRY
                </span>
              </div>
              <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted mt-0.5 flex items-center gap-1">
                <Hash size={11} />
                {entry.id?.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isVoided && (
                <button
                  onClick={() => setShowVoid(true)}
                  className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 size={13} />
                  Void
                </button>
              )}
              <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <div className="bg-hotel-surface dark:bg-hotel-dark-surface rounded-xl p-4">
              {entry.staff_name && (
                <Row label="Staff" value={<span className="flex items-center gap-1 justify-end"><User size={12} />{entry.staff_name}</span>} />
              )}
              <Row label="Date" value={<span className="flex items-center gap-1 justify-end"><Calendar size={12} />{entry.date}</span>} />
              <Row
                label="Created"
                value={entry.created_at ? format(parseISO(entry.created_at), 'MMM d, yyyy h:mm a') : '—'}
              />
              {rooms.length > 0 && (
                <Row label="Rooms" value={<span className="flex items-center gap-1 justify-end"><Home size={12} />{rooms.map((r) => r.type).join(', ')}</span>} />
              )}
              {entry.notes && (
                <Row label="Notes" value={<span className="flex items-center gap-1 justify-end italic"><FileText size={12} />{entry.notes}</span>} />
              )}
              <Row
                label="Status"
                value={isVoided ? 'VOIDED' : 'Active'}
                className={isVoided ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}
              />
            </div>

            {/* Transactions table */}
            <div>
              <h4 className="section-heading mb-2">Payments</h4>
              <div className="hotel-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-hotel-surface dark:bg-hotel-dark-surface">
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-hotel-muted dark:text-hotel-dark-muted">Category</th>
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-hotel-muted dark:text-hotel-dark-muted">Method</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-hotel-muted dark:text-hotel-dark-muted">Amount</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-hotel-muted dark:text-hotel-dark-muted">Cash Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => {
                      const amt = Number(t.amount) || 0
                      let impact = 0
                      if (t.payment_method === 'Cash') {
                        impact = t.category === 'Cashbox Adjustment' ? -amt : amt
                      }
                      const impCls =
                        impact > 0 ? 'text-emerald-600 dark:text-emerald-400'
                        : impact < 0 ? 'text-red-600 dark:text-red-400'
                        : 'text-hotel-muted dark:text-hotel-dark-muted'
                      return (
                        <tr key={i} className="border-t border-hotel-border dark:border-hotel-dark-border">
                          <td className="px-3 py-2.5 text-hotel-text dark:text-hotel-dark-text text-xs">{t.category}</td>
                          <td className="px-3 py-2.5 text-center"><PaymentBadge method={t.payment_method} size="xs" /></td>
                          <td className="px-3 py-2.5 text-right text-hotel-text dark:text-hotel-dark-text font-medium text-xs">{fmt(amt)}</td>
                          <td className={`px-3 py-2.5 text-right font-semibold text-xs ${impCls}`}>
                            {impact === 0 ? '—' : `${impact > 0 ? '+' : ''}${fmt(impact)}`}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-hotel-surface dark:bg-hotel-dark-surface rounded-xl p-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-hotel-muted dark:text-hotel-dark-muted">Total Amount</span>
                <span className="font-semibold text-hotel-text dark:text-hotel-dark-text">{fmt(computedTotal)}</span>
              </div>
              {computedNonCash > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-hotel-muted dark:text-hotel-dark-muted">Non-Cash</span>
                  <span className="text-hotel-text dark:text-hotel-dark-text">{fmt(computedNonCash)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-1.5 border-t border-hotel-border dark:border-hotel-dark-border">
                <span className="font-semibold text-hotel-text dark:text-hotel-dark-text">Net Cash Impact</span>
                <span className={impactClass}>{cashImpact >= 0 ? '+' : ''}{fmt(cashImpact)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showVoid && (
        <VoidConfirmModal
          item={entry}
          type="entry"
          onConfirm={async () => {
            await voidEntry(entry)
            setShowVoid(false)
            onClose()
          }}
          onClose={() => setShowVoid(false)}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Dispatcher — accepts either entry or expense
// ─────────────────────────────────────────────────────────────────
export default function TransactionModal({ entry, expense, onClose }) {
  if (expense) return <ExpenseModal expense={expense} onClose={onClose} />
  if (entry) return <EntryModal entry={entry} onClose={onClose} />
  return null
}
