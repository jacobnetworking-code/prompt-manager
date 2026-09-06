# Prompt Manager — M1.6.3 Gate 1

Purpose: validate a remote MCP endpoint on Supabase Edge Functions before adding authentication or database access.

This package intentionally exposes only `ping`.
It does not read or write Supabase tables.

Expected production endpoint:
https://jqrqsztmcfqfnnzyfjge.supabase.co/functions/v1/mcp

Deploy with:
supabase functions deploy --no-verify-jwt mcp

Important:
Do not add `save_prompt` until MCP authentication is implemented.
