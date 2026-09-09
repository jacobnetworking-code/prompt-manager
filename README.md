# Prompt Manager — M1.6.5.11

## Changes
- Featured images and the current Seedance video preload silently after authentication.
- The app remains usable immediately; preload runs in idle time / shortly after login and never blocks Home.
- Images use browser image decoding/cache.
- Video uses `preload="auto"` with muted inline loading.
- Existing service-worker runtime caching remains the second cache layer.
- Only current Featured media is preloaded, not the whole catalog.
- What's New updated to V1.6.5.11.
- No SQL/schema changes.

## Commit title
M1.6.5.11 — Preload Featured Media After Login

## Replace
- ui-refine.js
- sw.js
- README.md

## Add
- none

## Delete
- none
