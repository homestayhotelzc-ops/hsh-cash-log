# 🏨 Home Stay Hotel — Cash Log App

A production-ready hotel cash operations dashboard built with **React + Vite + TailwindCSS + Supabase**.

Replaces Airtable for real-time hotel cash logging: guest payments, expenses, opening cash, void history, and live manager monitoring across all devices.

---

## ✅ Build Status

```
✓ 1936 modules transformed
✓ 0 errors
✓ Production build: ~476 kB JS / 34 kB CSS (gzipped: ~130 kB / 6 kB)
```

---

## 📋 Feature Checklist

| Feature | Status |
|---|---|
| Dashboard with live KPI cards | ✅ |
| Transaction feed with payment badges | ✅ |
| Add Entry — multi-step form (4 steps) | ✅ |
| Multiple rooms per entry | ✅ |
| Multiple payment rows per entry | ✅ |
| Expenses page with category chips | ✅ |
| Cash vs Non-Cash expense logic | ✅ |
| Opening Cash — lock/unlock with password | ✅ |
| Summary / Shift Closing panel | ✅ |
| Cash Count Check (expected vs actual) | ✅ |
| Void transactions (password: `bugU`) | ✅ |
| Void expenses (password: `bugU`) | ✅ |
| Void history — audit log | ✅ |
| Staff entries view | ✅ |
| Transaction detail modal | ✅ |
| Dark mode + Light mode toggle | ✅ |
| Theme persistence (localStorage) | ✅ |
| Supabase Realtime subscriptions | ✅ |
| Multi-device live sync | ✅ |
| Mobile bottom navigation | ✅ |
| Desktop sidebar navigation | ✅ |
| Date navigation (prev/next day) | ✅ |

---

## 🔐 Environment Variables

Create a `.env` file in the project root (same level as `package.json`):

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ Both variables are **required** for data persistence and real-time sync.  
> Without them, the app runs in **demo mode** (UI only, no data saved).

| Variable | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → `anon` `public` key |

---

## 🗄️ Supabase Setup

### Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose your organization, give it a name (e.g. `homestay-hotel`), set a database password
4. Wait ~2 minutes for provisioning

### Step 2 — Run the SQL schema

1. In your Supabase project, open **SQL Editor** (left sidebar)
2. Click **New query**
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Click **Run** (or press `Ctrl+Enter`)

This creates all tables, indexes, Row Level Security policies, and seeds 5 default staff members.

### Step 3 — Enable Realtime

Realtime is enabled via the schema SQL (`ALTER PUBLICATION supabase_realtime ADD TABLE ...`), but verify:

1. In Supabase Dashboard, go to **Database → Replication**
2. Under **supabase_realtime**, confirm these tables are listed:
   - `cash_entries`
   - `expenses`
   - `opening_cash`
   - `voided_entries`
   - `voided_expenses`
3. If any are missing, run in SQL Editor:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE cash_entries;
   ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
   ALTER PUBLICATION supabase_realtime ADD TABLE opening_cash;
   ALTER PUBLICATION supabase_realtime ADD TABLE voided_entries;
   ALTER PUBLICATION supabase_realtime ADD TABLE voided_expenses;
   ```

### Step 4 — Copy your credentials

1. Go to **Project Settings → API**
2. Copy **Project URL** → paste as `VITE_SUPABASE_URL`
3. Copy **anon public** key → paste as `VITE_SUPABASE_ANON_KEY`

---

## 💻 Run Locally

```bash
# 1. Clone / navigate to project
cd homestay-cash-log

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env and add your Supabase credentials

# 4. Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🚀 Deploy to Vercel

### Method A — Vercel CLI (recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# From the project directory
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Framework: Vite (auto-detected)
# - Build command: npm run build  (auto-detected)
# - Output directory: dist  (auto-detected)
```

Then add environment variables:
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
# Paste values when prompted
# Select: Production, Preview, Development

# Deploy to production
vercel --prod
```

### Method B — Vercel Dashboard (GitHub)

1. Push your project to a GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Vercel auto-detects Vite — no configuration needed
5. Before deploying, click **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://your-project.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJ...` |

6. Click **Deploy**

### Vercel `vercel.json` (SPA routing)

Create this file in the project root to ensure client-side routing works correctly:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 🔄 How Realtime Sync Works

The app uses **Supabase Realtime** (PostgreSQL logical replication via WebSockets):

```
Staff device (encodes entry)
    │
    ▼
Supabase DB INSERT
    │
    ▼
Supabase Realtime broadcasts change event
    │
    ├──▶ Manager's phone (live update, instant)
    ├──▶ Front desk tablet (live update)
    └──▶ Any other connected device
```

Each device subscribes to a channel scoped to the **selected date**:

```js
supabase.channel(`hsh-${selectedDate}`)
  .on('postgres_changes', { event: '*', table: 'cash_entries' }, refetch)
  .on('postgres_changes', { event: '*', table: 'expenses' }, refetch)
  .subscribe()
```

When any staff member adds/voids an entry, **all connected devices refresh within ~200ms**.

---

## 💰 Cash Logic Reference

| Transaction Type | Cash Impact |
|---|---|
| Cash payment (any category except Cashbox Adjustment) | ➕ Cash In |
| Cashbox Adjustment (Cash method) | ➖ Cash Out |
| GCash / Maya / Bank (any category) | 0 — Non-Cash only |
| Cash Expense | ➖ Deducted from cash on hand |
| Non-Cash Expense | 0 — Logged in expense totals only |

**Ending Cash formula:**
```
Ending Cash = Opening Cash + Cash In − Cash Out − Cash Expenses
```

**Net Cash Impact formula:**
```
Net Cash Impact = Cash In − Cash Out − Cash Expenses
```

> Security Deposits are **not** auto-adjusted. Staff must manually add a Cashbox Adjustment entry when cash is returned.

---

## 🔑 Password Reference

| Action | Password |
|---|---|
| Void a transaction | `bugU` |
| Void an expense | `bugU` |
| Unlock Opening Cash for editing | `bugU` |

---

## 📁 Project Structure

```
homestay-cash-log/
├── .env                          ← Your credentials (create from .env.example)
├── .env.example                  ← Template
├── vercel.json                   ← SPA routing for Vercel (create before deploy)
├── supabase/
│   └── schema.sql                ← Full DB schema — run this in Supabase SQL Editor
├── src/
│   ├── lib/supabase.js           ← Supabase client init
│   ├── contexts/
│   │   ├── ThemeContext.jsx      ← Dark/light mode
│   │   └── DataContext.jsx       ← All data, realtime, calculations
│   ├── components/
│   │   ├── Layout.jsx            ← App shell (sidebar + header + bottom nav)
│   │   ├── Header.jsx            ← Date navigator + theme toggle
│   │   ├── Sidebar.jsx           ← Desktop left nav
│   │   ├── BottomNav.jsx         ← Mobile bottom nav
│   │   ├── KPICard.jsx           ← Metric cards
│   │   ├── PaymentBadge.jsx      ← Cash/GCash/Maya/Bank/VOIDED badges
│   │   ├── TransactionCard.jsx   ← Feed card
│   │   ├── TransactionModal.jsx  ← Detail modal + void
│   │   └── VoidConfirmModal.jsx  ← Password-gated void
│   └── pages/
│       ├── Dashboard.jsx         ← KPIs + transaction feed
│       ├── AddEntry.jsx          ← 4-step entry form
│       ├── Expenses.jsx          ← Expense form + list
│       ├── Summary.jsx           ← Shift close + cash count + void history
│       └── Staff.jsx             ← Staff cards + activity
```

---

## 📱 Device Support

| Device | Layout |
|---|---|
| Desktop (≥768px) | Left sidebar + main content |
| Mobile / Tablet (<768px) | Top header + bottom navigation bar |

---

## 🏗️ Production Checklist

- [x] `npm run build` — 0 errors, 0 warnings
- [x] All 5 pages render without runtime errors
- [x] Dark mode / light mode toggle works
- [x] Theme preference persists across page reloads
- [x] Date navigation (prev/next day) works
- [x] All form validations in place
- [x] Void password gate on all destructive actions
- [x] Opening cash lock/unlock with password
- [x] Graceful offline mode when Supabase not configured
- [x] Supabase Realtime subscriptions wired
- [x] Row Level Security policies enabled
- [x] Mobile responsive layout
- [x] Safe array parsing (no crash on null/undefined data)

---

*© 2026 Home Stay Hotel. Internal operations tool.*
