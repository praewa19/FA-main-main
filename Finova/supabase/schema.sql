create table if not exists public.profiles (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade unique,
  name text not null,
  birthdate date not null,
  priority text not null,
  mode text not null,
  has_debt boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.incomes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade unique,
  period text not null,
  amount numeric not null,
  monthly_income numeric not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.budget_plans (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade unique,
  monthly_income numeric not null,
  has_debt boolean not null default false,
  percentages jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null,
  type text not null,
  label text not null,
  priority text not null,
  weight numeric not null default 1,
  monthly_limit numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_type text not null,
  goal_id text references public.goals(id) on delete set null,
  amount numeric not null,
  note text,
  date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.transactions drop constraint if exists transactions_category_type_check;

create index if not exists transactions_user_goal_idx on public.transactions (user_id, goal_id);

create table if not exists public.habits (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  budget_adherence boolean not null default false,
  spending_control boolean not null default false,
  savings_action boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.debt_obligations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  original_amount numeric not null,
  annual_interest_rate numeric not null default 0,
  remaining_months integer not null,
  amount_repaid numeric not null default 0,
  emi_day integer not null default 1,
  goal text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.goals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  emoji text not null default '*',
  target numeric not null,
  current numeric not null default 0,
  deadline date not null,
  priority text not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.savings_targets (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target numeric not null,
  current numeric not null default 0,
  monthly_contribution numeric not null default 0,
  deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.custom_habits (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  icon text not null default '*',
  cadence text not null default 'daily',
  target_days integer not null default 30,
  completed_today boolean not null default false,
  streak integer not null default 0,
  best_streak integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.habit_logs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id text not null references public.custom_habits(id) on delete cascade,
  log_date date not null,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, habit_id, log_date)
);

create table if not exists public.investment_holdings (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  name text not null,
  shares numeric not null default 0,
  total_cost numeric not null default 0,
  asset_type text not null default 'stock',
  exchange text,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (user_id, symbol)
);

create table if not exists public.assistant_conversations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  source_page text not null default 'assistant',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.incomes enable row level security;
alter table public.budget_plans enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.habits enable row level security;
alter table public.debt_obligations enable row level security;
alter table public.goals enable row level security;
alter table public.savings_targets enable row level security;
alter table public.custom_habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.investment_holdings enable row level security;
alter table public.assistant_conversations enable row level security;

create policy "Users manage own profiles" on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own incomes" on public.incomes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own budget plans" on public.budget_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own categories" on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own transactions" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own habits" on public.habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own debts" on public.debt_obligations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own goals" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own savings targets" on public.savings_targets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own custom habits" on public.custom_habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own habit logs" on public.habit_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own investment holdings" on public.investment_holdings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own assistant conversations" on public.assistant_conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
