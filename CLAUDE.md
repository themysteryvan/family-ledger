@AGENTS.md

# Family Ledger — Codebase Reference

## What This App Does

Family Ledger is a household financial management dashboard. It lets a family track income, expenses, assets, debts, retirement accounts, and financial projects in one place, with AI-powered advice, PDF/Excel import, and optional Supabase cloud sync.

Users can run it fully offline (all state in localStorage) or sign in with Supabase Auth to persist data to the cloud and sync across devices.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.6 (App Router, React 19) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + CSS custom properties |
| State | Zustand 5 with `persist` middleware (localStorage) |
| Database | Supabase (PostgreSQL + RLS + Auth) |
| Charts | Recharts 3 |
| Icons | Lucide React |
| AI | Anthropic Claude Sonnet (via REST API) |
| File parsing | ExcelJS (xlsx), Claude document API (PDF) |
| Font | DM Sans (Google Fonts) |

---

## Pages & Features

| Route | Feature |
|---|---|
| `/dashboard` | Net worth, monthly cash flow, expense breakdown, debt summary cards |
| `/income` | Income sources by owner, monthly/annual totals, active status |
| `/expenses` | Spending by category, fixed vs variable, charts |
| `/assets` | Asset allocation by type, liquidity analysis |
| `/debts` | Debt list with interest rates, minimums, payoff progress |
| `/budget` | Category spending vs income allocation |
| `/retirement` | 401k/IRA/Roth accounts, contribution tracking, limits |
| `/projects` | Financial goals (home reno, vacation, etc.) with line-item expenses |
| `/net-worth` | Net worth trend chart, assets vs debt, balance sheet |
| `/health-score` | A–F financial wellness grade, radar chart, breakdown |
| `/forecasts` | 12-month and 5-year projections (hardcoded 7% return, $3200/mo debt payoff assumptions) |
| `/reports` | Monthly income/expense/savings report (current month only — historical is placeholder) |
| `/import` | CSV/PDF/Excel import with AI categorization |
| `/advisor` | Claude-powered financial chatbot with full household financial context |
| `/settings` | Household name, email/password, Supabase sync status, Plaid placeholder |
| `/login` | Supabase email/password auth (sign in + sign up) |

---

## API Routes

| Route | Purpose |
|---|---|
| `POST /api/advisor` | Claude chatbot — takes `{ messages, financialContext }`, returns `{ reply }` |
| `POST /api/categorize` | Claude categorizes transactions — takes `{ transactions[] }`, returns `{ categories }` |
| `POST /api/parse-pdf` | Claude parses PDF bank statement via FormData, returns `{ transactions[] }` |
| `POST /api/parse-excel` | Reads Family Ledger Excel template (5 sheets), returns all financial data |
| `GET /api/download-template` | Returns formatted .xlsx import template |

All Claude calls use `claude-sonnet-4-5` and `ANTHROPIC_API_KEY` from env.

---

## Database Schema

**Critical note**: `schema.sql` is **out of date**. The mappers in `src/lib/supabase/mappers.ts` define the real column names in the live Supabase database. Trust the mappers, not `schema.sql`.

### Actual column names (from mappers.ts)

**`households`** — `id`, `user_id` (FK to auth.users), `name`, `created_at`

**`income`** *(table name is `income`, not `incomes`)* — `id`, `household_id`, `name`, `amount`, `frequency`, `type` (not `category`), `guaranteed` (not `is_active`), `start_date`, `data_source`, `notes`

**`expenses`** — `id`, `household_id`, `name`, `amount`, `frequency`, `category`, `fixed` (not `is_fixed`), `essential` (not `is_essential`), `data_source`, `notes`

**`assets`** — `id`, `household_id`, `name`, `value`, `type` (not `category`), `owner`, `institution`, `liquidity`, `data_source`, `notes`

**`debts`** — `id`, `household_id`, `name`, `type` (not `category`), `original_balance`, `current_balance` (not `balance`), `interest_rate`, `minimum_payment`, `data_source`, `notes`

**`retirement_accounts`** — `id`, `household_id`, `name`, `type`, `owner`, `current_balance` (not `balance`), `monthly_contribution` (not `contribution_ytd`), `employer_match` (not `employer_match_pct`), `institution`, `data_source`, `notes`

**`projects`** — `id`, `household_id`, `name`, `description`, `target_amount` (not `total_budget`), `current_amount` (not `amount_spent`), `category`, `target_date`, `notes`

**`project_expenses`** — `id`, `project_id`, `name`, `amount`, `is_paid`, `due_date`

### RLS bugs in schema.sql (do not run it)
- `project_expenses` policy references `h.owner_id` — should be `h.user_id`
- `retirement_accounts` policy references `owner_id` on households — should be `user_id`

---

## State Management

Zustand store at `src/store/finance-store.ts`:
- All financial data lives here (incomes, expenses, assets, debts, projects, retirementAccounts)
- Persisted to `localStorage` under key `family-ledger-store`
- On login, a one-time migration pushes localStorage data into Supabase (`family-ledger-migrated` flag prevents re-runs)
- After migration, all CRUD operations write to both Zustand and Supabase in parallel
- `skipHydration: true` on the persist middleware avoids React hydration mismatches; the store is manually rehydrated after mount

---

## Type System

`src/types/index.ts` defines the domain types (camelCase). `src/lib/supabase/mappers.ts` has `Row` interfaces (snake_case) and bidirectional mappers (`toX` / `fromX`).

Key domain types:
- `Income` — `category` maps to DB `type`; `isActive` maps to DB `guaranteed`
- `Expense` — `isFixed` → `fixed`; `isEssential` → `essential`
- `Asset` — `category` → `type`; liquidity is derived from category by `assetLiquidity()` helper
- `Debt` — `category` → `type`; `balance` → `current_balance`
- `RetirementAccount` — `contributionYtd` → `monthly_contribution`; `employerMatchPct` → `employer_match`
- `Project` — `totalBudget` → `target_amount`; `amountSpent` → `current_amount`; `status` is always hardcoded to `"planned"` on DB read (not persisted)

---

## Known Issues & Incomplete Features

### Bugs
- **Project `status` not persisted** — `toProject()` in mappers.ts always sets `status: "planned"`, ignoring the DB value
- **`income` owner field not persisted** — `toIncome()` always sets `owner: ""`, the DB has no owner column
- **`fromDebt()` sends both `monthly_payment` and `minimum_payment`** — DB only has `minimum_payment`; the extra field may cause errors if the schema is strict
- **schema.sql RLS bugs** — `project_expenses` and `retirement_accounts` policies reference `owner_id` instead of `user_id` on households; queries will silently return no rows

### Incomplete / Placeholder
- **Plaid integration** — Settings page shows "Not connected" with no implementation
- **Historical reports** — `/reports` shows current month only; multi-month history is not stored
- **Forecast assumptions** — hardcoded 7% return rate and $3200/mo debt payoff, not user-configurable
- **No pagination** — all data is loaded into memory; large datasets may be slow
- **Project expenses Supabase sync** — project_expenses rows are managed in local state but the store code that persists them should be verified

---

## What We Were Last Working On

The last several commits were all fixing Supabase integration after initially building with localStorage only:

1. **Dashboard cash flow fix** — subtract debt minimum payments from monthly cash flow calculation
2. **Dashboard card additions** — added Min. Debt Payments card, reordered cash flow cards
3. **Sidebar nav reorder**
4. **Asset liquidity values** — `assetLiquidity()` helper mapping to valid DB CHECK constraint values
5. **Mapper rewrites** — all Supabase mappers rewritten to match actual DB column names (the schema.sql was never the source of truth)
6. **Migration fix** — one-time localStorage→Supabase migration reads raw localStorage directly because Zustand may not be rehydrated when it runs

The app is now mostly working end-to-end with Supabase. Likely next work: fix the known bugs above, or build out incomplete features like Plaid, historical reports, or user-configurable forecast assumptions.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `ANTHROPIC_API_KEY` | Claude API key (server-side only) |

---

## File Structure

```
src/
├── app/
│   ├── (auth)/login/         # Sign in / sign up
│   ├── (dashboard)/          # All dashboard pages + layout with Sidebar
│   └── api/                  # advisor, categorize, parse-pdf, parse-excel, download-template
├── components/
│   ├── sidebar.tsx
│   ├── auth-provider.tsx
│   ├── ui/                   # card, stat-card, form-field, modal, empty-state
│   └── forms/                # expense-form, income-form, asset-form, debt-form, retirement-form, project-form
├── lib/
│   ├── finance.ts            # All financial calculations
│   ├── utils.ts
│   └── supabase/             # client.ts, server.ts, mappers.ts
├── store/
│   └── finance-store.ts      # Zustand store with Supabase sync + migration
└── types/index.ts            # All domain type definitions
supabase/
└── schema.sql                # OUTDATED — do not run; use mappers.ts for truth
```
