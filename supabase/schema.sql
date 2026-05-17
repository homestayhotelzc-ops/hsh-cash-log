-- ============================================================
-- HOME STAY HOTEL — CASH LOG APP
-- Supabase Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- STAFF TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'staff',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default staff
INSERT INTO staff (name) VALUES
  ('Maria Santos'),
  ('Juan dela Cruz'),
  ('Ana Reyes'),
  ('Carlo Mendoza'),
  ('Liza Garcia')
ON CONFLICT DO NOTHING;

-- ============================================================
-- OPENING CASH TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS opening_cash (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CASH ENTRIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS cash_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_name TEXT NOT NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  staff_name TEXT,
  rooms JSONB DEFAULT '[]'::jsonb,
  transactions JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  total_amount NUMERIC(12,2) DEFAULT 0,
  cash_amount NUMERIC(12,2) DEFAULT 0,
  non_cash_amount NUMERIC(12,2) DEFAULT 0,
  cash_in NUMERIC(12,2) DEFAULT 0,
  cash_out NUMERIC(12,2) DEFAULT 0,
  net_cash_impact NUMERIC(12,2) DEFAULT 0,
  date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'voided')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXPENSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'GCash', 'Maya', 'Bank')),
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  staff_name TEXT,
  notes TEXT DEFAULT '',
  date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'voided')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VOIDED ENTRIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS voided_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id UUID,
  entry_data JSONB,
  voided_at TIMESTAMPTZ DEFAULT NOW(),
  voided_by TEXT DEFAULT 'system'
);

-- ============================================================
-- VOIDED EXPENSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS voided_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id UUID,
  expense_data JSONB,
  voided_at TIMESTAMPTZ DEFAULT NOW(),
  voided_by TEXT DEFAULT 'system'
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_cash_entries_date ON cash_entries(date);
CREATE INDEX IF NOT EXISTS idx_cash_entries_status ON cash_entries(status);
CREATE INDEX IF NOT EXISTS idx_cash_entries_date_status ON cash_entries(date, status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_opening_cash_date ON opening_cash(date);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- For a hotel internal app, we use open policies with the anon key.
-- For production with auth, replace these with user-based policies.

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE opening_cash ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE voided_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE voided_expenses ENABLE ROW LEVEL SECURITY;

-- Allow all operations with anon key (internal hotel app)
CREATE POLICY "Allow all staff" ON staff FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all opening_cash" ON opening_cash FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all cash_entries" ON cash_entries FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all expenses" ON expenses FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all voided_entries" ON voided_entries FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all voided_expenses" ON voided_expenses FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ============================================================
-- REALTIME PUBLICATION
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE cash_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE opening_cash;
ALTER PUBLICATION supabase_realtime ADD TABLE voided_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE voided_expenses;
