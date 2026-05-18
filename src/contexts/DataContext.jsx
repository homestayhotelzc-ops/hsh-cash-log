import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import { format } from 'date-fns'
import { supabase, isConfigured } from '../lib/supabase'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

// ── helpers ──────────────────────────────────────────────────
function safeArray(val) {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return [] }
  }
  return []
}

/**
 * Race a Supabase query against a timeout so a stale TCP connection
 * (e.g. after a browser tab switch or device sleep) cannot hang forever.
 */
function withTimeout(promise, ms = 10_000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Query timed out after ${ms}ms`)), ms)
    ),
  ])
}

export function calcEntryAmounts(transactions) {
  let cashIn = 0, cashOut = 0, nonCash = 0
  safeArray(transactions).forEach((t) => {
    const amt = Number(t.amount) || 0
    if (t.payment_method === 'Cash') {
      if (t.category === 'Cashbox Adjustment') cashOut += amt
      else cashIn += amt
    } else {
      nonCash += amt
    }
  })
  // Keys match Supabase column names (snake_case) exactly.
  // total_amount = revenue only (cashIn + nonCash).
  // Cashbox Adjustments (cashOut) are cash movements, NOT revenue — excluded.
  return {
    cash_in: cashIn,
    cash_out: cashOut,
    non_cash_amount: nonCash,
    total_amount: cashIn + nonCash,   // revenue only — NO cashbox adjustment
    cash_amount: cashIn,              // cash received from guest
    net_cash_impact: cashIn - cashOut,
  }
}

// Derive display values by re-reading an entry's transactions array.
// Always use this instead of stored fields — guards against stale DB values.
export function computeEntryDisplay(entry) {
  const txs = safeArray(entry?.transactions)
  let cashIn = 0, cashOut = 0, nonCash = 0
  txs.forEach((t) => {
    const amt = Number(t.amount) || 0
    if (t.payment_method === 'Cash') {
      if (t.category === 'Cashbox Adjustment') cashOut += amt
      else cashIn += amt
    } else {
      nonCash += amt
    }
  })
  // totalAmount = revenue (cashIn + nonCash). Cashbox Adjustments excluded.
  return {
    totalAmount: cashIn + nonCash,
    cashIn,
    cashOut,
    nonCash,
    netCashImpact: cashIn - cashOut,
  }
}

export function calcTotals(entries, expenseList, openingCashAmt) {
  const active = safeArray(entries).filter((e) => e.status === 'active')
  const activeExp = safeArray(expenseList).filter((e) => e.status === 'active')

  // Per-method non-cash breakdown (for GCash / Maya / Bank cards)
  let cashIn = 0, cashOut = 0, nonCash = 0, gcash = 0, maya = 0, bank = 0
  active.forEach((e) => {
    const t = safeArray(e.transactions)
    t.forEach((tx) => {
      const amt = Number(tx.amount) || 0
      if (tx.payment_method === 'Cash') {
        if (tx.category === 'Cashbox Adjustment') cashOut += amt
        else cashIn += amt
      } else {
        nonCash += amt
        if (tx.payment_method === 'GCash')     gcash += amt
        else if (tx.payment_method === 'Maya') maya  += amt
        else if (tx.payment_method === 'Bank') bank  += amt
      }
    })
  })

  let totalExpenses = 0, cashExpenses = 0
  activeExp.forEach((ex) => {
    const amt = Number(ex.amount) || 0
    totalExpenses += amt
    if (ex.payment_method === 'Cash') cashExpenses += amt
  })

  const opening = Number(openingCashAmt) || 0
  // Ending cash formula is unchanged — only cash flows affect the physical box
  const endingCash = opening + cashIn - cashOut - cashExpenses
  const netCashImpact = cashIn - cashOut - cashExpenses

  return {
    opening,
    cashIn,
    cashOut,
    nonCash,
    gcash,
    maya,
    bank,
    totalExpenses,
    cashExpenses,
    endingCash,
    netCashImpact,
    entryCount: active.length,
    expenseCount: activeExp.length,
  }
}

// ── provider ─────────────────────────────────────────────────
export function DataProvider({ children }) {
  const { user, profile } = useAuth()

  // Stable refs so save callbacks don't depend on auth state
  const authUserRef    = useRef(null)
  const authProfileRef = useRef(null)
  useEffect(() => {
    authUserRef.current    = user
    authProfileRef.current = profile
  }, [user, profile])

  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [entries, setEntries] = useState([])
  const [expenses, setExpenses] = useState([])
  const [openingCashRecord, setOpeningCashRecord] = useState(null)
  const [staff, setStaff] = useState([])
  const [profiles, setProfiles] = useState([])
  const [voidedEntries, setVoidedEntries] = useState([])
  const [voidedExpenses, setVoidedExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  // ── fetch ────────────────────────────────────────────────────
  const fetchAll = useCallback(async (date) => {
    if (!isConfigured || !supabase) {
      setLoading(false)
      return
    }
    setLoading(true)
    setFetchError(null)
    try {
      // Use Promise.allSettled + per-query timeout so a single stale connection
      // (tab switch, device sleep) cannot block the entire fetch indefinitely.
      const TIMEOUT = 10_000
      const [
        entriesRes,
        expensesRes,
        openingRes,
        staffRes,
        profilesRes,
        voidedEntriesRes,
        voidedExpensesRes,
      ] = await Promise.allSettled([
        withTimeout(
          supabase.from('cash_entries').select('*').eq('date', date).order('created_at', { ascending: false }),
          TIMEOUT
        ),
        withTimeout(
          supabase.from('expenses').select('*').eq('date', date).order('created_at', { ascending: false }),
          TIMEOUT
        ),
        withTimeout(
          supabase.from('opening_cash').select('*').eq('date', date).maybeSingle(),
          TIMEOUT
        ),
        withTimeout(
          supabase.from('staff').select('*').eq('active', true).order('name'),
          TIMEOUT
        ),
        withTimeout(
          supabase.from('profiles').select('*').order('full_name'),
          TIMEOUT
        ),
        withTimeout(
          supabase.from('voided_entries').select('*').order('voided_at', { ascending: false }).limit(100),
          TIMEOUT
        ),
        withTimeout(
          supabase.from('voided_expenses').select('*').order('voided_at', { ascending: false }).limit(100),
          TIMEOUT
        ),
      ])

      // Apply results — fall back to empty / null when a query failed or timed out
      setEntries(       entriesRes.status       === 'fulfilled' ? (entriesRes.value.data       ?? [])   : [])
      setExpenses(      expensesRes.status      === 'fulfilled' ? (expensesRes.value.data      ?? [])   : [])
      setOpeningCashRecord(openingRes.status    === 'fulfilled' ? (openingRes.value.data       ?? null) : null)
      setStaff(         staffRes.status         === 'fulfilled' ? (staffRes.value.data         ?? [])   : [])
      setProfiles(      profilesRes.status      === 'fulfilled' ? (profilesRes.value.data      ?? [])   : [])
      setVoidedEntries( voidedEntriesRes.status === 'fulfilled' ? (voidedEntriesRes.value.data ?? [])   : [])
      setVoidedExpenses(voidedExpensesRes.status === 'fulfilled' ? (voidedExpensesRes.value.data ?? []) : [])

      // Surface a non-blocking error banner if any query failed
      const failedCount = [
        entriesRes, expensesRes, openingRes, staffRes,
        profilesRes, voidedEntriesRes, voidedExpensesRes,
      ].filter((r) => r.status === 'rejected').length
      if (failedCount > 0) {
        setFetchError(
          `${failedCount} of 7 quer${failedCount === 1 ? 'y' : 'ies'} failed — data may be incomplete. Tap Retry.`
        )
      }
    } catch (err) {
      console.error('[Data] fetchAll error:', err)
      setFetchError('Failed to load data. Check your connection and tap Retry.')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── realtime subscriptions ───────────────────────────────────
  useEffect(() => {
    // Clear data immediately when user signs out
    if (!user) {
      setEntries([])
      setExpenses([])
      setOpeningCashRecord(null)
      setStaff([])
      setProfiles([])
      setVoidedEntries([])
      setVoidedExpenses([])
      setFetchError(null)
      setLoading(false)
      return
    }

    fetchAll(selectedDate)
    if (!isConfigured || !supabase) return

    const channel = supabase
      .channel(`hsh-${selectedDate}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cash_entries' },
        () => fetchAll(selectedDate)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        () => fetchAll(selectedDate)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'opening_cash' },
        () => fetchAll(selectedDate)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'voided_entries' },
        () => fetchAll(selectedDate)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'voided_expenses' },
        () => fetchAll(selectedDate)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedDate, user, fetchAll])

  // ── mutations ─────────────────────────────────────────────────
  const saveEntry = useCallback(
    async (payload) => {
      if (!supabase) throw new Error('Supabase not configured')
      const u = authUserRef.current
      const p = authProfileRef.current
      const amounts = calcEntryAmounts(payload.transactions)
      const row = {
        ...payload,
        ...amounts,
        date: selectedDate,
        status: 'active',
        // Auth-derived identity — overrides any caller-supplied values.
        // Falls back to email when profile hasn't loaded yet.
        staff_id:            u?.id   ?? payload.staff_id   ?? null,
        staff_name:          p?.full_name ?? u?.email ?? payload.staff_name ?? null,
        created_by_user_id:  u?.id   ?? null,
        created_by_name:     p?.full_name ?? u?.email ?? null,
        created_by_role:     p?.role ?? null,
      }
      const { data, error } = await supabase
        .from('cash_entries')
        .insert([row])
        .select()
        .single()
      if (error) throw error
      return data
    },
    [selectedDate]
  )

  const saveExpense = useCallback(
    async (payload) => {
      if (!supabase) throw new Error('Supabase not configured')
      const u = authUserRef.current
      const p = authProfileRef.current
      const row = {
        ...payload,
        date: selectedDate,
        status: 'active',
        // Auth-derived identity — overrides any caller-supplied values.
        // Falls back to email when profile hasn't loaded yet.
        staff_id:            u?.id   ?? payload.staff_id   ?? null,
        staff_name:          p?.full_name ?? u?.email ?? payload.staff_name ?? null,
        created_by_user_id:  u?.id   ?? null,
        created_by_name:     p?.full_name ?? u?.email ?? null,
        created_by_role:     p?.role ?? null,
      }
      const { data, error } = await supabase
        .from('expenses')
        .insert([row])
        .select()
        .single()
      if (error) throw error
      return data
    },
    [selectedDate]
  )

  const voidEntry = useCallback(async (entry) => {
    if (!supabase) throw new Error('Supabase not configured')
    const [{ error: updateErr }, { error: voidErr }] = await Promise.all([
      supabase
        .from('cash_entries')
        .update({ status: 'voided' })
        .eq('id', entry.id),
      supabase
        .from('voided_entries')
        .insert([{ original_id: entry.id, entry_data: entry }]),
    ])
    if (updateErr) throw updateErr
    if (voidErr) throw voidErr
  }, [])

  const voidExpense = useCallback(async (expense) => {
    if (!supabase) throw new Error('Supabase not configured')
    const [{ error: updateErr }, { error: voidErr }] = await Promise.all([
      supabase
        .from('expenses')
        .update({ status: 'voided' })
        .eq('id', expense.id),
      supabase
        .from('voided_expenses')
        .insert([{ original_id: expense.id, expense_data: expense }]),
    ])
    if (updateErr) throw updateErr
    if (voidErr) throw voidErr
  }, [])

  const saveOpeningCash = useCallback(
    async (amount) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('opening_cash')
        .upsert(
          [{ date: selectedDate, amount: Number(amount), locked: true }],
          { onConflict: 'date' }
        )
        .select()
        .single()
      if (error) throw error
      setOpeningCashRecord(data)
      return data
    },
    [selectedDate]
  )

  const unlockOpeningCash = useCallback(async () => {
    if (!supabase || !openingCashRecord) throw new Error('No opening cash record')
    const { error } = await supabase
      .from('opening_cash')
      .update({ locked: false })
      .eq('date', selectedDate)
    if (error) throw error
    setOpeningCashRecord((prev) => prev ? { ...prev, locked: false } : prev)
  }, [selectedDate, openingCashRecord])

  const addStaff = useCallback(async (name) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase
      .from('staff')
      .insert([{ name }])
      .select()
      .single()
    if (error) throw error
    setStaff((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }, [])

  // Soft-delete: sets active=false so dropdowns hide them.
  // Historical entries keep their staff_name text — unaffected.
  const deleteStaff = useCallback(async (staffId) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase
      .from('staff')
      .update({ active: false })
      .eq('id', staffId)
    if (error) throw error
    setStaff((prev) => prev.filter((s) => s.id !== staffId))
  }, [])

  const totals = calcTotals(
    entries,
    expenses,
    openingCashRecord?.amount ?? 0
  )

  const activeEntries = entries.filter((e) => e.status === 'active')
  const activeExpenses = expenses.filter((e) => e.status === 'active')

  return (
    <DataContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        entries,
        activeEntries,
        expenses,
        activeExpenses,
        openingCashRecord,
        staff,
        profiles,
        voidedEntries,
        voidedExpenses,
        loading,
        fetchError,
        totals,
        refetch: () => fetchAll(selectedDate),
        saveEntry,
        saveExpense,
        voidEntry,
        voidExpense,
        saveOpeningCash,
        unlockOpeningCash,
        addStaff,
        deleteStaff,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
