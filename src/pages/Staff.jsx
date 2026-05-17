import React, { useState } from 'react'
import { Users, Plus, Clock, X, CheckCircle, Trash2, Lock, AlertTriangle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useData, computeEntryDisplay } from '../contexts/DataContext'
import { isConfigured } from '../lib/supabase'
import TransactionModal from '../components/TransactionModal'

const DELETE_PASSWORD = 'bugU'

function fmt(n) {
  return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

// ── Inline delete confirm ──────────────────────────────────────
function DeleteStaffModal({ staffName, onConfirm, onClose }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handle(e) {
    e.preventDefault()
    if (pw !== DELETE_PASSWORD) { setErr('Incorrect password.'); return }
    setLoading(true)
    try { await onConfirm() }
    catch (ex) { setErr(ex.message ?? 'Failed to delete.') }
    finally { setLoading(false) }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      style={{ background: 'rgba(26,18,9,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div className="hotel-card w-full max-w-sm modal-content">
        <div className="flex items-start gap-3 p-5 pb-4 border-b border-hotel-border dark:border-hotel-dark-border">
          <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
            <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-hotel-text dark:text-hotel-dark-text text-sm">
              Remove Staff Member
            </h3>
            <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted mt-0.5">
              <strong>{staffName}</strong> will be hidden from dropdowns. Historical entries are kept.
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1 rounded-lg">
            <X size={14} />
          </button>
        </div>
        <form onSubmit={handle} className="p-5 space-y-4">
          <div>
            <label className="hotel-label flex items-center gap-1.5">
              <Lock size={10} /> Manager Password
            </label>
            <input
              type="password"
              className="hotel-input"
              placeholder="Enter password to confirm"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setErr('') }}
              autoFocus
            />
            {err && <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">{err}</p>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              type="submit"
              disabled={loading || !pw}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function Staff() {
  const { staff, activeEntries, addStaff, deleteStaff, selectedDate } = useData()

  const [selectedId, setSelectedId] = useState(null)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, name }

  const staffCards = staff.map((s) => {
    const entries = activeEntries.filter((e) => e.staff_id === s.id)
    const cashImpact = entries.reduce((sum, e) => sum + computeEntryDisplay(e).netCashImpact, 0)
    return { ...s, entries, cashImpact }
  })

  const selectedStaff = staffCards.find((s) => s.id === selectedId)

  async function handleAddStaff(e) {
    e.preventDefault()
    if (!newName.trim()) return
    if (!isConfigured) { setAddError('Supabase not configured.'); return }
    setAdding(true)
    setAddError('')
    try {
      await addStaff(newName.trim())
      setNewName('')
      setAddSuccess(true)
      setTimeout(() => { setShowAdd(false); setAddSuccess(false) }, 1500)
    } catch (err) {
      setAddError(err.message ?? 'Failed to add staff.')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(staffId) {
    await deleteStaff(staffId)
    // If the deleted staff was selected, deselect
    if (selectedId === staffId) setSelectedId(null)
    setDeleteTarget(null)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-hotel-text dark:text-hotel-dark-text">Staff</h1>
          <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted mt-0.5">
            Activity overview · {selectedDate}
          </p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="btn-secondary flex items-center gap-1.5 text-xs"
        >
          {showAdd ? <X size={13} /> : <Plus size={13} />}
          {showAdd ? 'Cancel' : 'Add Staff'}
        </button>
      </div>

      {/* Add staff form */}
      {showAdd && (
        <form onSubmit={handleAddStaff} className="hotel-card p-4 space-y-3 animate-slide-up">
          <h3 className="section-heading">New Staff Member</h3>
          <div className="flex gap-2">
            <input
              className="hotel-input flex-1"
              placeholder="Full name"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setAddError('') }}
              autoFocus
            />
            <button type="submit" disabled={adding || !newName.trim()} className="btn-primary">
              {adding ? '…' : 'Add'}
            </button>
          </div>
          {addError && <p className="text-xs text-red-600 dark:text-red-400">{addError}</p>}
          {addSuccess && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs">
              <CheckCircle size={13} /> Staff member added!
            </div>
          )}
        </form>
      )}

      {/* Team overview */}
      <div>
        <h2 className="section-heading mb-3">Team — {selectedDate}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {staffCards.map((s) => (
            <div
              key={s.id}
              className={`hotel-card p-4 transition-all hover:shadow-hotel-md dark:hover:shadow-hotel-dark-md relative group ${
                selectedId === s.id ? 'ring-2 ring-hotel-accent dark:ring-hotel-dark-accent' : ''
              }`}
            >
              {/* Delete button — appears on hover */}
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: s.id, name: s.name }) }}
                className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                title="Remove staff member"
              >
                <Trash2 size={13} />
              </button>

              {/* Card body — clickable for entries */}
              <button
                onClick={() => setSelectedId(selectedId === s.id ? null : s.id)}
                className="w-full text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-hotel-surface dark:bg-hotel-dark-surface border border-hotel-border dark:border-hotel-dark-border flex items-center justify-center mb-3">
                  <span className="text-sm font-bold text-hotel-accent dark:text-hotel-dark-accent">
                    {s.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="font-semibold text-sm text-hotel-text dark:text-hotel-dark-text truncate pr-6">
                  {s.name}
                </p>
                <div className="flex items-end justify-between mt-1.5">
                  <div>
                    <p className="text-2xl font-bold text-hotel-accent dark:text-hotel-dark-accent leading-none">
                      {s.entries.length}
                    </p>
                    <p className="text-[11px] text-hotel-muted dark:text-hotel-dark-muted">
                      entr{s.entries.length !== 1 ? 'ies' : 'y'}
                    </p>
                  </div>
                  {s.cashImpact !== 0 && (
                    <span className={`text-xs font-semibold ${s.cashImpact >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {s.cashImpact >= 0 ? '+' : ''}{fmt(s.cashImpact)}
                    </span>
                  )}
                </div>
              </button>
            </div>
          ))}

          {staffCards.length === 0 && (
            <div className="col-span-2 sm:col-span-3 hotel-card p-8 flex flex-col items-center gap-3 text-center">
              <Users size={28} className="text-hotel-border dark:text-hotel-dark-border" />
              <p className="text-sm text-hotel-muted dark:text-hotel-dark-muted">No staff members found.</p>
              <p className="text-xs text-hotel-muted dark:text-hotel-dark-muted">
                {isConfigured
                  ? 'Add staff or run the SQL schema to seed defaults.'
                  : 'Connect Supabase to manage staff.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Selected staff entries */}
      {selectedStaff && (
        <div className="space-y-3 animate-slide-up">
          <h2 className="section-heading flex items-center gap-2">
            <Users size={14} />
            {selectedStaff.name}'s Entries Today
          </h2>

          {selectedStaff.entries.length === 0 ? (
            <div className="hotel-card p-6 text-center text-sm text-hotel-muted dark:text-hotel-dark-muted">
              No entries recorded yet today.
            </div>
          ) : (
            <div className="space-y-2">
              {selectedStaff.entries.map((e) => (
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
                    const { netCashImpact, nonCash } = computeEntryDisplay(e)
                    return (
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${netCashImpact >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {netCashImpact >= 0 ? '+' : ''}{fmt(netCashImpact)}
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
          {selectedStaff.entries.length > 0 && (
            <div className="hotel-card p-4 bg-hotel-surface dark:bg-hotel-dark-surface">
              <p className="text-xs font-semibold text-hotel-muted dark:text-hotel-dark-muted uppercase tracking-wider mb-2">
                {selectedStaff.name}'s Totals
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-hotel-muted dark:text-hotel-dark-muted">Net Cash Impact</span>
                <span className={`font-bold ${selectedStaff.cashImpact >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {selectedStaff.cashImpact >= 0 ? '+' : ''}{fmt(selectedStaff.cashImpact)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-hotel-muted dark:text-hotel-dark-muted">Non-Cash Collected</span>
                <span className="font-medium text-hotel-text dark:text-hotel-dark-text">
                  {fmt(selectedStaff.entries.reduce((s, e) => s + computeEntryDisplay(e).nonCash, 0))}
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

      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteStaffModal
          staffName={deleteTarget.name}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
