import React from 'react'
import { format, parseISO } from 'date-fns'
import { User, Clock, Home, ChevronRight } from 'lucide-react'
import PaymentBadge from './PaymentBadge'

function fmt(n) {
  return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

function safeArray(v) {
  if (Array.isArray(v)) return v
  try { return JSON.parse(v) } catch { return [] }
}

export default function TransactionCard({ entry, onClick }) {
  const transactions = safeArray(entry.transactions)
  const rooms = safeArray(entry.rooms)
  const isVoided = entry.status === 'voided'

  const cashImpact = Number(entry.net_cash_impact ?? 0)
  const impactClass =
    cashImpact > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : cashImpact < 0
      ? 'text-red-600 dark:text-red-400'
      : 'text-hotel-muted dark:text-hotel-dark-muted'

  const time = entry.created_at
    ? format(parseISO(entry.created_at), 'h:mm a')
    : '—'

  const payMethods = [...new Set(transactions.map((t) => t.payment_method).filter(Boolean))]

  return (
    <button
      onClick={onClick}
      className={`w-full text-left hotel-card p-4 hover:shadow-hotel-md dark:hover:shadow-hotel-dark-md transition-all duration-200 active:scale-[0.99] ${
        isVoided ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Guest + voided badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-hotel-text dark:text-hotel-dark-text text-sm truncate">
              {entry.guest_name || 'Unknown Guest'}
            </span>
            {isVoided && <PaymentBadge method="VOIDED" voided />}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-hotel-muted dark:text-hotel-dark-muted flex-wrap">
            {entry.staff_name && (
              <span className="flex items-center gap-1">
                <User size={11} />
                {entry.staff_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {time}
            </span>
            {rooms.length > 0 && (
              <span className="flex items-center gap-1">
                <Home size={11} />
                {rooms.map((r) => r.type).join(', ')}
              </span>
            )}
          </div>

          {/* Categories */}
          {transactions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {transactions.slice(0, 3).map((t, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-hotel-surface dark:bg-hotel-dark-surface text-hotel-muted dark:text-hotel-dark-muted border border-hotel-border dark:border-hotel-dark-border"
                >
                  {t.category}
                </span>
              ))}
              {transactions.length > 3 && (
                <span className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted">
                  +{transactions.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Payment badges */}
          {payMethods.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {payMethods.map((m) => (
                <PaymentBadge key={m} method={m} size="xs" />
              ))}
            </div>
          )}

          {/* Notes snippet */}
          {entry.notes && (
            <p className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted line-clamp-1 italic">
              "{entry.notes}"
            </p>
          )}
        </div>

        {/* Right: amount + chevron */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-base font-bold ${impactClass}`}>
            {cashImpact >= 0 ? '+' : ''}{fmt(cashImpact)}
          </span>
          {Number(entry.non_cash_amount) > 0 && (
            <span className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted">
              {fmt(entry.non_cash_amount)} non-cash
            </span>
          )}
          <ChevronRight size={14} className="text-hotel-border dark:text-hotel-dark-border mt-1" />
        </div>
      </div>
    </button>
  )
}
