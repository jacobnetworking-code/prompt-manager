# Prompt Manager — M1.6.5.1

## Fix
M1.6.5 used `window.supabaseClient`, but `app.js` defines `const supabaseClient` in the global script scope rather than as a property on `window`.

The Share flow therefore stopped before making any Supabase request and surfaced `Share unavailable`.

## Changes
- Public Share now uses the existing `supabaseClient` instance from `app.js`.
- Improves console diagnostics for any subsequent Supabase/RLS error.
- What's New updated to V1.6.5.1.
- Service worker cache bumped to `pm-m1.6.5.1-v1`.
- No database/schema changes.

## Commit title
M1.6.5.1 — Fix Public Share Client

## Replace
- ui-refine.js
- sw.js
- README.md

## Add
- none

## Delete
- none
