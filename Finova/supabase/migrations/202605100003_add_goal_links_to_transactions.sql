alter table public.transactions
  add column if not exists goal_id text references public.goals(id) on delete set null;

create index if not exists transactions_user_goal_idx
  on public.transactions (user_id, goal_id);
