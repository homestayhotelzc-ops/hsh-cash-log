import React from 'react'
import { format, parseISO } from 'date-fns'
import {
  Home, User, Clock, ShoppingBag, Receipt,
  ChevronRight, AlertCircle,
} from 'lucide-react'
import PaymentBadge from './PaymentBadge'

function fmt(n) {
  return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

function safeArray(v) {
  if (Array.isArray(v)) return v
  try { return JSON.parse(v) } catch { return [] }
}

function timeStr(ts) {
  if (!ts) return '—'
  try { return format(parseISO(ts), 'h:mm a') } catch { return '—' }
}

// ── Expense Feed Card ──────────────────────────────────────────
function ExpenseFeedCard({ data, isVoided, onClick }) {
  if (!data) return null
  const amt = Number(data.amount || 0)
  const isCash = data.payment_method === 'Cash'

  const ICONS = {
    Supplies: '🧹', Maintenance: '🔧', Laundry: '👕',
    Transportation: '🚗', Food: '🍱', Refund: '↩️', Other: '📦',
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 hover:shadow-hotel-md dark:hover:shadow-hotel-dark-md active:scale-[0.99] ${
        isVoided
          ? 'opacity-50 bg-hotel-card dark:bg-hotel-dark-card border-hotel-border dark:border-hotel-dark-border'
          : 'bg-red-50/60 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 shadow-hotel dark:shadow-hotel-dark'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base ${
          isVoided
            ? 'bg-hotel-surface dark:bg-hotel-dark-surface'
            : 'bg-red-100/80 dark:bg-red-900/30'
        }`}>
          {ICONS[data.category] ?? '📦'}
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            {/* Left: title + subtitle */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-hotel-text dark:text-hotel-dark-text">
                  {data.category ?? 'Expense'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isVoided
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40'
                }`}>
                  {isVoided ? 'VOIDED' : 'EXPENSE'}
                </span>
              </div>
              {/* Meta */}
              <div className="flex items-center gap-3 mt-1 text-xs text-hotel-muted dark:text-hotel-dark-muted flex-wrap">
                {data.staff_name && (
                  <span className="flex items-center gap-1">
                    <User size={10} /> {data.staff_name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock size={10} /> {timeStr(data.created_at)}
                </span>
              </div>
              {/* Badges */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {data.payment_method && (
                  <PaymentBadge method={data.payment_method} size="xs" />
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-hotel-surface dark:bg-hotel-dark-surface text-hotel-muted dark:text-hotel-dark-muted border border-hotel-border dark:border-hotel-dark-border flex items-center gap-1">
                  <ShoppingBag size={9} /> Expense
                </span>
              </div>
              {data.notes && (
                <p className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted italic mt-1 line-clamp-1">
                  "{data.notes}"
                </p>
              )}
            </div>

            {/* Right: amount + time */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={`text-base font-bold ${isVoided ? 'text-hotel-muted dark:text-hotel-dark-muted line-through' : 'text-red-600 dark:text-red-400'}`}>
                {isCash ? '−' : ''}{fmt(amt)}
              </span>
              {!isCash && (
                <span className="text-[10px] text-hotel-muted dark:text-hotel-dark-muted">
                  non-cash
                </span>
              )}
              <ChevronRight size={13} className="text-hotel-border dark:text-hotel-dark-border mt-0.5" />
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

// ── Entry Feed Card ────────────────────────────────────────────
function EntryFeedCard({ data, isVoided, onClick }) {
  if (!data) return null
  const transactions = safeArray(data.transactions)
  const rooms = safeArray(data.rooms)
  const payMethods = [...new Set(transactions.map((t) => t.payment_method).filter(Boolean))]
  const categories = [...new Set(transactions.map((t) => t.category).filter(Boolean))]

  // Always compute from the transactions array — never trust stored computed fields
  let _ci = 0, _co = 0, _nc = 0
  transactions.forEach((t) => {
    const amt = Number(t.amount) || 0
    if (t.payment_method === 'Cash') {
      if (t.category === 'Cashbox Adjustment') _co += amt
      else _ci += amt
    } else _nc += amt
  })
  const cashImpact = _ci - _co
  const nonCashDisplay = _nc

  const impactClass =
    isVoided ? 'text-hotel-muted dark:text-hotel-dark-muted'
    : cashImpact > 0 ? 'text-emerald-600 dark:text-emerald-400'
    : cashImpact < 0 ? 'text-red-600 dark:text-red-400'
    : 'text-hotel-muted dark:text-hotel-dark-muted'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left hotel-card p-4 transition-all duration-200 hover:shadow-hotel-md dark:hover:shadow-hotel-dark-md active:scale-[0.99] ${
        isVoided ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="shrink-0 w-9 h-9 rounded-xl bg-hotel-surface dark:bg-hotel-dark-surface border border-hotel-border dark:border-hotel-dark-border flex items-center justify-center">
          <Receipt size={15} className="text-hotel-accent dark:text-hotel-dark-accent" />
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            {/* Left */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-hotel-text dark:text-hotel-dark-text">
                  {data.guest_name || 'Unknown Guest'}
                </span>
                {isVoided && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40">
                    VOIDED
                  </span>
                )}
              </div>
              {/* Meta row */}
              <div className="flex items-center gap-3 mt-1 text-xs text-hotel-muted dark:text-hotel-dark-muted flex-wrap">
                {data.staff_name && (
                  <span className="flex items-center gap-1">
                    <User size={10} /> {data.staff_name}
                  </span>
                )}
                {rooms.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Home size={10} /> {rooms.map((r) => r.type).join(', ')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock size={10} /> {timeStr(data.created_at)}
                </span>
              </div>
              {/* Badges */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {payMethods.map((m) => (
                  <PaymentBadge key={m} method={m} size="xs" />
                ))}
                {categories.slice(0, 2).map((c, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-hotel-surface dark:bg-hotel-dark-surface text-hotel-muted dark:text-hotel-dark-muted border border-hotel-border dark:border-hotel-dark-border">
                    {c}
                  </span>
                ))}
                {categories.length > 2 && (
                  <span className="text-[10px] text-hotel-muted dark:text-hotel-dark-muted">
                    +{categories.length - 2}
                  </span>
                )}
              </div>
              {data.notes && (
                <p className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted italic mt-1 line-clamp-1">
                  "{data.notes}"
                </p>
              )}
            </div>

            {/* Right: amount */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={`text-base font-bold ${impactClass}`}>
                {!isVoided && cashImpact >= 0 ? '+' : ''}{fmt(cashImpact)}
              </span>
              {nonCashDisplay > 0 && (
                <span className="text-[10px] text-hotel-muted dark:text-hotel-dark-muted">
                  {fmt(nonCashDisplay)} non-cash
                </span>
              )}
              <ChevronRight size={13} className="text-hotel-border dark:text-hotel-dark-border mt-0.5" />
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

// ── Unified FeedCard ───────────────────────────────────────────
export default function FeedCard({ item, onClick }) {
  if (!item) return null
  const isVoided = item.type === 'voided_entry' || item.type === 'voided_expense'

  if (item.type === 'expense' || item.type === 'voided_expense') {
    return <ExpenseFeedCard data={item.data} isVoided={isVoided} onClick={onClick} />
  }
  return <EntryFeedCard data={item.data} isVoided={isVoided} onClick={onClick} />
}
