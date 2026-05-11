create table if not exists public.assistant_conversations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  source_page text not null default 'assistant',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assistant_conversations enable row level security;

create policy "Users manage own assistant conversations"
  on public.assistant_conversations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
