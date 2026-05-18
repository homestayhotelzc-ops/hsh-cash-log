import React, { useState } from 'react'
import { Users, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useData, computeEntryDisplay } from '../contexts/DataContext'
import TransactionModal from '../components/TransactionModal'

function fmt(n) {
  return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

const ROLE_BADGE = {
  manager:      { label: 'Manager',     cls: 'bg-hotel-accent/10 dark:bg-hotel-dark-accent/10 text-hotel-accent dark:text-hotel-dark-accent border-hotel-accent/20 dark:border-hotel-dark-accent/20' },
  front_desk:   { label: 'Front Desk',  cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40' },
  housekeeping: { label: 'Housekeeping', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40' },
}

// ── Main page ─────────────────────────────────────────────────
export default function Staff() {
  const { profiles, activeEntries, selectedDate } = useData()

  const [selectedId,    setSelectedId]    = useState(null)
  const [selectedEntry, setSelectedEntry] = useState(null)

  // Build per-profile summary cards
  const profileCards = profiles.map((p) => {
    const entries = activeEntries.filter(
      (e) => e.created_by_user_id === p.id
    )
    let totalRevenue = 0, cashImpact = 0
    entries.forEach((e) => {
      const d = computeEntryDisplay(e)
      totalRevenue += d.totalAmount
      cashImpact   += d.netCashImpact
    })
    return { ...p, entries, totalRevenue, cashImpact }
  })

  const selectedProfile = profileCards.find((p) => p.id === selectedId)

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-hotel-text dark:text-hotel-dark-text">Staff</h1>
        <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted mt-0.5">
          Activity overview · {selectedDate}
        </p>
      </div>

      {/* Team grid */}
      <div>
        <h2 className="section-heading mb-3">Team — {selectedDate}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {profileCards.map((p) => {
            const badge = ROLE_BADGE[p.role] ?? ROLE_BADGE.front_desk
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
                className={`hotel-card p-4 text-left transition-all hover:shadow-hotel-md dark:hover:shadow-hotel-dark-md ${
                  selectedId === p.id ? 'ring-2 ring-hotel-accent dark:ring-hotel-dark-accent' : ''
                }`}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-hotel-surface dark:bg-hotel-dark-surface border border-hotel-border dark:border-hotel-dark-border flex items-center justify-center mb-3">
                  <span className="text-sm font-bold text-hotel-accent dark:text-hotel-dark-accent">
                    {p.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Name */}
                <p className="font-semibold text-sm text-hotel-text dark:text-hotel-dark-text truncate">
                  {p.full_name}
                </p>

                {/* Role badge */}
                <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-md border mt-1 ${badge.cls}`}>
                  {badge.label}
                </span>

                {/* Stats */}
                <div className="flex items-end justify-between mt-2.5">
                  <div>
                    <p className="text-2xl font-bold text-hotel-accent dark:text-hotel-dark-accent leading-none">
                      {p.entries.length}
                    </p>
                    <p className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted">
                      entr{p.entries.length !== 1 ? 'ies' : 'y'}
                    </p>
                  </div>
                  {p.totalRevenue > 0 && (
                    <span className="text-xs font-semibold text-hotel-accent dark:text-hotel-dark-accent">
                      {fmt(p.totalRevenue)}
                    </span>
                  )}
                </div>
              </button>
            )
          })}

          {profileCards.length === 0 && (
            <div className="col-span-2 sm:col-span-3 hotel-card p-8 flex flex-col items-center gap-3 text-center">
              <Users size={28} className="text-hotel-border dark:text-hotel-dark-border" />
              <p className="text-sm text-hotel-muted dark:text-hotel-dark-muted">No staff profiles found.</p>
              <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted">
                Create user accounts in Supabase — profiles are auto-created on first login.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Selected staff entries drill-down */}
      {selectedProfile && (
        <div className="space-y-3 animate-slide-up">
          <h2 className="section-heading flex items-center gap-2">
            <Users size={14} />
            {selectedProfile.full_name}'s Entries Today
          </h2>

          {selectedProfile.entries.length === 0 ? (
            <div className="hotel-card p-6 text-center text-sm text-hotel-muted dark:text-hotel-dark-muted">
              No entries recorded yet today.
            </div>
          ) : (
            <div className="space-y-2">
              {selectedProfile.entries.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelectedEntry(e)}
                  className="w-full hotel-card p-4 text-left hover:shadow-hotel-md dark:hover:shadow-hotel-dark-md transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-hotel-text dark:text-hotel-dark-text truncate">
                      {e.guest_name}
                    </p>
                    <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      {e.created_at ? format(parseISO(e.created_at), 'h:mm a') : '—'}
                      {Array.isArray(e.rooms) && e.rooms.length > 0 && (
                        <span className="ml-1">· {e.rooms.map((r) => r.type).join(', ')}</span>
                      )}
                    </p>
                  </div>

                  {(() => {
                    const { totalAmount, netCashImpact, nonCash, cashIn, cashOut } = computeEntryDisplay(e)
                    const isPureNonCash = cashIn === 0 && cashOut === 0 && nonCash > 0
                    return (
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${
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
                        </p>
                        {nonCash > 0 && (
                          <p className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted">
                            {fmt(nonCash)} non-cash
                          </p>
                        )}
                      </div>
                    )
                  })()}
                </button>
              ))}
            </div>
          )}

          {/* Staff totals */}
          {selectedProfile.entries.length > 0 && (
            <div className="hotel-card p-4 bg-hotel-surface dark:bg-hotel-dark-surface">
              <p className="text-xs font-semibold text-hotel-muted dark:text-hotel-dark-muted uppercase tracking-wider mb-2">
                {selectedProfile.full_name}'s Totals
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-hotel-muted dark:text-hotel-dark-muted">Total Revenue</span>
                <span className="font-bold text-hotel-text dark:text-hotel-dark-text">
                  {fmt(selectedProfile.totalRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-hotel-muted dark:text-hotel-dark-muted">Net Cash Impact</span>
                <span className={`font-bold ${selectedProfile.cashImpact >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {selectedProfile.cashImpact >= 0 ? '+' : ''}{fmt(selectedProfile.cashImpact)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-hotel-muted dark:text-hotel-dark-muted">Non-Cash Collected</span>
                <span className="font-medium text-hotel-text dark:text-hotel-dark-text">
                  {fmt(selectedProfile.entries.reduce((s, e) => s + computeEntryDisplay(e).nonCash, 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Entry detail modal */}
      {selectedEntry && (
        <TransactionModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  )
}
