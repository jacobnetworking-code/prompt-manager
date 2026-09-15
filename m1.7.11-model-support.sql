-- Prompt Manager M1.7.11 — additive, non-destructive model metadata
alter table public.prompts
  add column if not exists models text[] not null default '{}'::text[];

comment on column public.prompts.models is
  'Normalized model metadata. Empty = unspecified; multimodel = intentionally model-agnostic; otherwise one or more model names.';
