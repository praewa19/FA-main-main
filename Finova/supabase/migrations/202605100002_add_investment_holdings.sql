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

alter table public.investment_holdings enable row level security;

create policy "Users manage own investment holdings" on public.investment_holdings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
