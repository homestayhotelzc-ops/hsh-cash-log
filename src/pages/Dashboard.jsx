import React, { useState, useMemo } from 'react'
import {
  Wallet, TrendingUp, ArrowDownLeft, DollarSign,
  Smartphone, CreditCard, Landmark,
  RefreshCw, Inbox,
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { isConfigured } from '../lib/supabase'
import KPICard from '../components/KPICard'
import FeedCard from '../components/FeedCard'
import TransactionModal from '../components/TransactionModal'

function fmt(n) {
  return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

const FILTERS = [
  { id: 'all',      label: 'All' },
  { id: 'entries',  label: 'Entries' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'cash',     label: 'Cash' },
  { id: 'non-cash', label: 'Non-Cash' },
  { id: 'voided',   label: 'Voided' },
]

export default function Dashboard() {
  const {
    totals, activeEntries, activeExpenses,
    voidedEntries, voidedExpenses,
    loading, fetchError, refetch, selectedDate,
  } = useData()

  const [filter, setFilter] = useState('all')
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [selectedExpense, setSelectedExpense] = useState(null)

  // ── Unified chronological feed ─────────────────────────────────
  const feedItems = useMemo(() => {
    const items = []

    activeEntries.forEach((e) =>
      items.push({ type: 'entry', id: `e-${e.id}`, data: e, ts: e.created_at ?? '' })
    )
    activeExpenses.forEach((e) =>
      items.push({ type: 'expense', id: `ex-${e.id}`, data: e, ts: e.created_at ?? '' })
    )
    voidedEntries.forEach((v) =>
      items.push({ type: 'voided_entry', id: `ve-${v.id}`, data: v.entry_data ?? {}, ts: v.voided_at ?? '' })
    )
    voidedExpenses.forEach((v) =>
      items.push({ type: 'voided_expense', id: `vx-${v.id}`, data: v.expense_data ?? {}, ts: v.voided_at ?? '' })
    )

    return items.sort((a, b) => (b.ts > a.ts ? 1 : b.ts < a.ts ? -1 : 0))
  }, [activeEntries, activeExpenses, voidedEntries, voidedExpenses])

  // ── Filter logic ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    switch (filter) {
      case 'entries':
        return feedItems.filter((i) => i.type === 'entry')
      case 'expenses':
        return feedItems.filter((i) => i.type === 'expense')
      case 'cash':
        return feedItems.filter((i) => {
          if (i.type === 'entry') {
            const txs = Array.isArray(i.data.transactions) ? i.data.transactions : []
            return txs.some((t) => t.payment_method === 'Cash')
          }
          if (i.type === 'expense') return i.data.payment_method === 'Cash'
          return false
        })
      case 'non-cash':
        return feedItems.filter((i) => {
          if (i.type === 'entry') {
            const txs = Array.isArray(i.data.transactions) ? i.data.transactions : []
            return txs.some((t) => t.payment_method !== 'Cash')
          }
          return false
        })
      case 'voided':
        return feedItems.filter((i) => i.type === 'voided_entry' || i.type === 'voided_expense')
      default: // 'all' — active items only, no voided
        return feedItems.filter((i) => i.type === 'entry' || i.type === 'expense')
    }
  }, [feedItems, filter])

  // ── Item click dispatcher ──────────────────────────────────────
  function handleItemClick(item) {
    if (item.type === 'entry') {
      setSelectedEntry(item.data)
    } else if (item.type === 'expense') {
      setSelectedExpense(item.data)
    } else if (item.type === 'voided_entry') {
      setSelectedEntry({ ...(item.data ?? {}), status: 'voided' })
    } else if (item.type === 'voided_expense') {
      setSelectedExpense({ ...(item.data ?? {}), status: 'voided' })
    }
  }

  const activeCount = activeEntries.length + activeExpenses.length
  // Combined cash deductions: cashbox adjustments + cash expenses
  const totalCashOut = totals.cashOut + totals.cashExpenses

  return (
    <div className="space-y-7 animate-fade-in">

      {/* ── Page heading ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-hotel-text dark:text-hotel-dark-text">
            Dashboard
          </h1>
          <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted mt-0.5">
            Live cash overview · {selectedDate}
          </p>
        </div>
        <button
          onClick={refetch}
          className="p-2 rounded-xl hover:bg-hotel-surface dark:hover:bg-hotel-dark-surface transition-colors"
          title="Refresh"
        >
          <RefreshCw
            size={15}
            strokeWidth={1.75}
            className={`text-hotel-muted dark:text-hotel-dark-muted ${loading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* ── Fetch error / retry banner ──────────────────────────── */}
      {fetchError && (
        <div className="hotel-card p-4 border-l-4 border-red-400 flex items-center justify-between gap-3">
          <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed flex-1">
            {fetchError}
          </p>
          <button
            onClick={refetch}
            className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-hotel-accent dark:text-hotel-dark-accent hover:opacity-80 transition-opacity"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      )}

      {/* ── Demo mode banner ────────────────────────────────────── */}
      {!isConfigured && (
        <div className="hotel-card p-5 border-l-4 border-hotel-accent">
          <h3 className="font-semibold text-hotel-text dark:text-hotel-dark-text text-sm">
            Running in Demo Mode
          </h3>
          <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted mt-1 leading-relaxed">
            No Supabase credentials found. Data will not persist or sync across devices.
            Create a <code className="font-mono bg-hotel-surface dark:bg-hotel-dark-surface px-1 rounded">.env</code> file
            with your Supabase URL and anon key to enable full functionality.
          </p>
        </div>
      )}

      {/* ── KPI Cards ── Row 1: Cash flow ───────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          label="Opening Cash"
          value={fmt(totals.opening)}
          helper="Start of day"
          icon={Wallet}
          accent
        />
        <KPICard
          label="Cash In"
          value={fmt(totals.cashIn)}
          helper="Cash receipts today"
          icon={TrendingUp}
          positive={totals.cashIn > 0}
        />
        <KPICard
          label="Cash Out / Expenses"
          value={fmt(totalCashOut)}
          helper="Adjustments + cash expenses"
          icon={ArrowDownLeft}
          negative={totalCashOut > 0}
        />
        <KPICard
          label="Ending Cash"
          value={fmt(totals.endingCash)}
          helper="Expected on hand"
          icon={DollarSign}
          positive={totals.endingCash > 0}
          negative={totals.endingCash < 0}
        />
      </div>

      {/* ── KPI Cards ── Row 2: Payment method breakdown ────────── */}
      <div className="grid grid-cols-3 gap-3">
        <KPICard
          label="GCash"
          value={fmt(totals.gcash)}
          helper="E-wallet collected"
          icon={Smartphone}
        />
        <KPICard
          label="Maya"
          value={fmt(totals.maya)}
          helper="E-wallet collected"
          icon={CreditCard}
        />
        <KPICard
          label="Bank Transfer"
          value={fmt(totals.bank)}
          helper="Bank deposits"
          icon={Landmark}
        />
      </div>

      {/* ── Activity Feed ───────────────────────────────────────── */}
      <div>
        {/* Feed header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-semibold text-hotel-text dark:text-hotel-dark-text">
              Activity Feed
            </h2>
            <p className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted mt-0.5">
              {activeCount} active transaction{activeCount !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-150 ${
                  filter === f.id
                    ? 'bg-hotel-accent text-white shadow-sm'
                    : 'bg-hotel-surface dark:bg-hotel-dark-surface text-hotel-muted dark:text-hotel-dark-muted hover:bg-hotel-border dark:hover:bg-hotel-dark-border border border-hotel-border dark:border-hotel-dark-border'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feed list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="hotel-card p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-xl bg-hotel-surface dark:bg-hotel-dark-surface" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-hotel-surface dark:bg-hotel-dark-surface rounded w-1/3" />
                    <div className="h-3 bg-hotel-surface dark:bg-hotel-dark-surface rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="hotel-card p-12 flex flex-col items-center gap-3 text-center">
            <Inbox size={28} strokeWidth={1.5} className="text-hotel-border dark:text-hotel-dark-border" />
            <div>
              <p className="font-semibold text-hotel-text dark:text-hotel-dark-text text-sm">
                Nothing here yet
              </p>
              <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted mt-1">
                {filter === 'all'
                  ? 'Add an entry or expense to get started'
                  : `No ${filter} items for this date`}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((item) => (
              <FeedCard
                key={item.id}
                item={item}
                onClick={() => handleItemClick(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────── */}
      {selectedEntry && (
        <TransactionModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
      {selectedExpense && (
        <TransactionModal
          expense={selectedExpense}
          onClose={() => setSelectedExpense(null)}
        />
      )}
    </div>
  )
}
