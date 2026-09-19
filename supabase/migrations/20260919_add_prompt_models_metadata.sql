alter table public.prompts
  add column if not exists models text[] not null default '{}'::text[];

comment on column public.prompts.models is
  'AI model metadata associated with a saved prompt.';
