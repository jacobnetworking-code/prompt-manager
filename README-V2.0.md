# Prompt Manager V2.0 — Prompt Chains

The ZIP mirrors the repository paths exactly.

## REPLACE — main / repository root
- index.html
- sw.js

## ADD — main / repository root
- chain-v2.js
- chain-v2.css

## ADD — supabase/migrations/
- 20260918_prompt_chains_v2.sql

## Supabase
After uploading the repository files, run `supabase/migrations/20260918_prompt_chains_v2.sql` in the Supabase SQL Editor.

The migration is additive: it creates `prompt_chains` and `prompt_chain_steps` and enables owner-only RLS.
