-- Prompt Manager V2.0.11 — Chain Library metadata and authenticated grants
alter table public.prompt_chains
  add column if not exists rating smallint null,
  add column if not exists use_count integer not null default 0;

alter table public.prompt_chains
  drop constraint if exists prompt_chains_rating_check;
alter table public.prompt_chains
  add constraint prompt_chains_rating_check check (rating is null or rating between 1 and 5);

alter table public.prompt_chains
  drop constraint if exists prompt_chains_use_count_check;
alter table public.prompt_chains
  add constraint prompt_chains_use_count_check check (use_count >= 0);

grant select, insert, update, delete on table public.prompt_chains to authenticated;
grant select, insert, update, delete on table public.prompt_chain_steps to authenticated;
