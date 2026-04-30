# Finova

Finova is a full-stack intelligent budgeting web application. It is built as a financial decision assistant, not just an expense tracker. The app helps users allocate income, track spending by priority, detect financial risk, rank problem categories, generate numeric recommendations, track habits, calculate a financial health score, and show gold/silver insights.

## Quick Start

Install Node.js first. Use Node.js `20.9.0` or newer. Node `24.x` also works.

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

The frontend and backend run together through Next.js. You do not need to start a separate backend server.

## Running On Another Computer

Send the project folder as a zip. The receiver should:

1. Extract the zip.
2. Open a terminal inside the extracted folder.
3. Run `npm install`.
4. Copy `.env.example` to `.env.local` and set the Supabase project URL and anon key.
5. Run `npm run dev`.
6. Visit `http://localhost:3000`.

For a smaller zip, you can exclude these generated folders before zipping:

```text
node_modules
.next
data
```

They are not required in the zip. `node_modules` is recreated by `npm install`, `.next` is recreated by `npm run dev` or `npm run build`, and `data/db.json` is recreated automatically when the app runs.

## Available Commands

```bash
npm install
```

Installs all dependencies from `package.json` and `package-lock.json`.

```bash
npm run dev
```

Starts the development server. This activates both the frontend and backend API routes.

```bash
npm run build
```

Creates a production build and validates that the app compiles.

```bash
npm run start
```

Runs the production server after `npm run build`.

```bash
npm run check
```

Alias for `npm run build`.

```bash
npm run reset:data
```

Deletes the local JSON database in `data/`. The app will recreate it on the next request.

## Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Set:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

These values are available in Supabase under Project Settings > API. Enable email/password signups in Supabase Authentication before testing signup and login. Add your local callback URL, such as `http://localhost:3000/auth/callback`, to the allowed redirect URLs so email verification and password reset links can create a secure session.

## App Flow

1. User signs up with email and password.
2. Supabase Auth stores credentials and manages the secure session cookie.
3. If email confirmation is enabled in Supabase, the user confirms through the email link before logging in.
4. User completes onboarding:
   - name
   - birthdate
   - monthly or annual income
   - priority: saving, debt reduction, or lifestyle
   - profile mode: student, professional, or family
   - debt status
5. The budget engine generates a monthly plan.
6. The dashboard shows allocation, spending status, graphs, risk ranking, recommendations, habits, financial health score, and metal insights.

## Codebase Structure

```text
app/
  layout.jsx
  page.jsx
  globals.css
  api/
    assistant/summary/route.js
    auth/signup/route.js
    auth/login/route.js
    auth/logout/route.js
    auth/me/route.js
    auth/verify/route.js
    habits/route.js
    onboarding/route.js
    transactions/route.js
  auth/callback/route.js

lib/
  auth.js
  budget.js
  store.js

scripts/
  reset-data.mjs

data/
  db.json
```

## Frontend

The frontend is in `app/page.jsx` and `app/globals.css`.

Main UI pieces:

- Landing and auth panel
- Email verification screen
- Onboarding form
- Dashboard
- Category tracking
- Transaction/activity entry form
- Actual vs expected spending graph
- Budget allocation chart
- Risk ranking panel
- Recommendations panel
- Daily habit panel
- Gold and silver insights

Frontend libraries:

- React
- Next.js App Router
- Recharts for charts
- Lucide React for icons

## Backend

The backend is implemented with Next.js route handlers under `app/api`.

Important routes:

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/verify
GET  /auth/callback
GET  /reset-password
POST /api/onboarding
GET  /api/transactions
POST /api/transactions
GET  /api/habits
POST /api/habits
GET  /api/assistant/summary
```

The frontend calls these routes directly with `fetch`.

## Data Storage

This version uses a local JSON file instead of a database service:

```text
data/db.json
```

The store is managed by `lib/store.js`. If `data/db.json` does not exist, it is created automatically.

Stored collections:

- `users`
- `profiles`
- `incomes`
- `budgetPlans`
- `categories`
- `transactions`
- `habits`
- `recommendations`
- `metalSnapshots`

Supabase Auth is the source of truth for accounts and sessions. The local JSON store only keeps app-specific financial data keyed by the Supabase user id. For production, replace `lib/store.js` with a real database layer such as Supabase Postgres, Prisma + PostgreSQL, or another managed database.

## Financial Logic

Core logic lives in `lib/budget.js`.

Priority categories:

- `essentials`: Essential Expenses, high priority
- `debt`: Debt & Obligations, high priority
- `savings`: Financial Goals, medium priority
- `lifestyle`: Lifestyle / Discretionary, low priority

Base allocation if the user has no debt:

- 50% Essentials
- 30% Lifestyle
- 20% Savings

Base allocation if debt exists:

- 50% Essentials
- 20% Debt
- 20% Savings
- 10% Lifestyle

Income bands:

- Low income: higher essentials, lower lifestyle
- Medium income: balanced allocation
- High income: higher savings/investments

Profile modes:

- Student: stricter lifestyle control and emergency buffer guidance
- Professional: balanced default behavior
- Family: higher essentials tolerance and stronger emergency fund guidance

Rules:

- Deduct order: Essentials, Debt, Savings, Lifestyle
- Minimum savings target: 10%
- Essentials over 60% creates a warning
- Debt over 40% creates a risk alert
- Savings below 10% creates a warning

## Dashboard Formulas

Expected spend:

```text
Expected Spend = (Current Day / Total Days In Month) * Monthly Limit
```

Category status:

```text
Green: spent <= expected spend
Orange: spent > expected spend and spent <= monthly limit
Red: spent > monthly limit
```

Risk score:

```text
Risk Score = (Actual Spend / Expected Spend) * Weight
```

Weights:

- Essentials: `1.5`
- Debt: `1.5`
- Savings: `1.2`
- Lifestyle: `1.0`

Savings gap:

```text
Savings Gap = Ideal Savings - Current Savings
```

Gold/silver change:

```text
Change = Today - Yesterday
% Change = (Change / Yesterday) * 100
```

Financial health score components:

- Savings: 30%
- Debt: 25%
- Spending: 25%
- Habits: 20%

Score categories:

- 80-100: Excellent
- 50-79: Stable
- 0-49: Risk

## Local Development Notes

The app uses Indian rupee formatting (`INR`) because the gold/silver requirements mention change in rupees.

Gold and silver prices are currently demo values generated in `metalInsights()` inside `lib/budget.js`. To use real prices, replace that function with an API integration and cache results in `metalSnapshots`.

Email verification is handled by Supabase Auth. Configure the email templates and redirect URLs in the Supabase dashboard.

## Production Notes

Before deploying:

- Replace JSON storage with a real database.
- Add rate limiting to auth routes.
- Add CSRF protection if expanding beyond same-site cookie usage.
- Add input sanitization and audit logging for financial records.
- Use live gold/silver price APIs if needed.

## Troubleshooting

If the app does not start:

```bash
node --version
npm --version
npm install
npm run dev
```

If port `3000` is already used:

```bash
npm run dev -- -p 3001
```

Then open:

```text
http://localhost:3001
```

If you want a clean app with no accounts or transactions:

```bash
npm run reset:data
```

If production start fails, build first:

```bash
npm run build
npm run start
```

## Dependency Reference

Dependencies are listed in both `package.json` and `requirements.txt`.

Use `package.json` / `package-lock.json` as the source of truth for installation:

```bash
npm install
```
