create or replace function public.set_prompt_chains_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists prompt_chains_set_updated_at on public.prompt_chains;

create trigger prompt_chains_set_updated_at
before update on public.prompt_chains
for each row
execute function public.set_prompt_chains_updated_at();
