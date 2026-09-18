-- Prompt Manager V2.0 — Prompt Chains
-- Additive migration. Run only after taking a current backup of the existing Prompt Manager data.
create table if not exists public.prompt_chains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  description text not null default '' check (char_length(description) <= 300),
  category_id text not null default 'general',
  platform text not null default 'general',
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.prompt_chain_steps (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references public.prompt_chains(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  position integer not null check (position > 0),
  title text not null default '',
  content text not null check (char_length(content) > 0),
  prompt_id uuid null references public.prompts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(chain_id, position)
);
create index if not exists prompt_chains_user_created_idx on public.prompt_chains(user_id, created_at desc);
create index if not exists prompt_chain_steps_chain_position_idx on public.prompt_chain_steps(chain_id, position);
alter table public.prompt_chains enable row level security;
alter table public.prompt_chain_steps enable row level security;
drop policy if exists "prompt_chains_owner_all" on public.prompt_chains;
create policy "prompt_chains_owner_all" on public.prompt_chains for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "prompt_chain_steps_owner_all" on public.prompt_chain_steps;
create policy "prompt_chain_steps_owner_all" on public.prompt_chain_steps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
