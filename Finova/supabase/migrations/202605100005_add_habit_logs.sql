alter table public.custom_habits
  add column if not exists cadence text not null default 'daily';

create table if not exists public.habit_logs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id text not null references public.custom_habits(id) on delete cascade,
  log_date date not null,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, habit_id, log_date)
);

alter table public.habit_logs enable row level security;

create policy "Users manage own habit logs"
  on public.habit_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
