-- Prompt Manager M1.6.5 — Public Prompt Sharing Foundation
create extension if not exists pgcrypto;

create table if not exists public.prompt_shares (
  slug text primary key default encode(gen_random_bytes(12),'hex'),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  source_prompt_id uuid references public.prompts(id) on delete set null,
  title text not null,
  teaser text not null default '',
  category_id text not null default 'general',
  platforms text[] not null default array['general']::text[],
  source_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_user_id, source_prompt_id)
);

create table if not exists public.prompt_share_contents (
  share_slug text primary key references public.prompt_shares(slug) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  updated_at timestamptz not null default now()
);

alter table public.prompt_shares enable row level security;
alter table public.prompt_share_contents enable row level security;

-- Anyone may read teaser metadata for active shared prompts.
create policy "active shares public read" on public.prompt_shares
for select using (is_active = true or auth.uid() = owner_user_id);

-- Only owner can create/update/delete share metadata.
create policy "share owner insert" on public.prompt_shares
for insert to authenticated with check (auth.uid() = owner_user_id);
create policy "share owner update" on public.prompt_shares
for update to authenticated using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "share owner delete" on public.prompt_shares
for delete to authenticated using (auth.uid() = owner_user_id);

-- Full content is never readable anonymously. Any authenticated user can read
-- content only when the corresponding share is active; owner can always read it.
create policy "active share content authenticated read" on public.prompt_share_contents
for select to authenticated using (
  auth.uid() = owner_user_id
  or exists (
    select 1 from public.prompt_shares s
    where s.slug = share_slug and s.is_active = true
  )
);
create policy "share content owner insert" on public.prompt_share_contents
for insert to authenticated with check (auth.uid() = owner_user_id);
create policy "share content owner update" on public.prompt_share_contents
for update to authenticated using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "share content owner delete" on public.prompt_share_contents
for delete to authenticated using (auth.uid() = owner_user_id);

grant select on public.prompt_shares to anon, authenticated;
grant insert, update, delete on public.prompt_shares to authenticated;
grant select, insert, update, delete on public.prompt_share_contents to authenticated;
revoke all on public.prompt_share_contents from anon;
