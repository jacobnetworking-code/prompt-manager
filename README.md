# Prompt Manager M1.6.6.23

## Commit
`M1.6.6.23 — Fix Featured Freeze & Enable Offline Library`

## Replace
- `m1.6.6.22.js`
- `sw.js`
- `index.html`

## Add
None.

## Delete
None.

## Changes
- Fixes the Featured freeze caused by a self-triggering MutationObserver.
- Caches the Supabase browser SDK so persisted auth can initialize offline.
- Adds an offline navigation fallback to cached `index.html`.
- Keeps the existing IndexedDB Library available without internet.
- Existing local-first queued changes continue syncing when connectivity returns.
- Public Share and other cloud-only actions still require internet.

## Important
Open this release once while online so the new service worker and SDK are cached. After that, the installed PWA can launch offline and access the local Library.

## SQL
None.

## QA
- JavaScript syntax checked.
- Service worker syntax checked.
- Featured observer guard verified.
- Supabase SDK added to cache.
- Offline navigation fallback verified.
