# Prompt Manager M1.7.10

Stabilize Library Bootstrap & Add Auth Loading.

Replace:
- index.html
- product-ui.js
- product-ui.css
- sw.js

Add:
- sync-stabilizer.js

Delete: none.
SQL: none.

Fixes:
- Serializes cloud-library sync so auth bootstrap events cannot overlap.
- Replaces the local cloud snapshot atomically in one IndexedDB transaction.
- Prevents the intermittent duplicated Library cards caused by interleaved clear/add syncs.
- Adds delayed auth loading: Loading your library… / Signing in with Google…
- No-session startup reveals the existing login screen.
- Slow auth exposes Retry instead of an endless loader.
- Respects prefers-reduced-motion.

Service worker cache: pm-m1.7.10-v2.
