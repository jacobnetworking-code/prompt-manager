# Prompt Manager M1.7.9

Pre-alpha stabilization release.

Replace:
- product-ui.js
- product-ui.css
- sw.js

Fixes:
- Removes the obsolete M1.6.6.21 prompt-detail action layer that duplicated Save/Share.
- Fixes the Account/Profile freeze by making What's New observers idempotent and narrowing Profile rendering to Profile-only state.
- Makes Imported badge decoration idempotent to prevent another observer self-loop.
- New saves from Featured are labeled `Prompt Manager featured catalog`.
- Existing Featured saves display the corrected provenance without a silent cloud/data migration.
- Keeps Library origin selection visually synchronized with the active filter.
- Bumps the service-worker cache to `pm-m1.7.9-v1`.

SQL: none.
Delete: none.
Persistent data migration: none.
