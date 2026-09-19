# Prompt Manager — Consolidation Pass 1

## Goal
Stabilize startup/auth and reconnect/sync ownership while preserving all validated product behavior.

## Replaced
- app.js — single startup/auth coordinator; preserves offline verified-user entry; removes duplicate reconnect sync listener.
- product-ui.js — connectivity is presentation-only; no longer performs auth revalidation/cloud sync; removed legacy second auth loader.
- ui-refine.js — prompt `•••` Edit/Delete menu integrated directly into the active Library renderer.
- product-ui.css — prompt overflow menu styles integrated directly.
- chain-library-v2.js — compact icon menus integrated directly; edit/duplicate/delete refresh Chains in place and stay in Library instead of full-page reload.
- chain-library-v2.css — compact Chain menu styles integrated directly.
- model-registry.js — no longer loads empty Chain hotfix.
- index.html — removed duplicate offline-auth runtime.
- sw.js — removed dead patch assets from precache and awaits runtime cache writes.

## Delete from repository
These files are intentionally removed only after their useful behavior was integrated or verified obsolete:
- offline-auth.js
- v237-ui.js
- prompt-menu-v236.js
- v235-stability.js
- chain-library-hotfix-v2.js

## Deliberately not changed yet
- IndexedDB account isolation architecture.
- Chain local-first persistence/sync.
- Historical canonical filename renames (`desktop-v1`, `chain-v2`, `chain-library-v2`).
- Large CSS cascade cleanup.
- Supabase schema/security/performance cleanup.
- MCP repository/deployment drift.

Those are separate passes so regressions can be isolated.

## Validation performed
- `node --check` passed for all JavaScript files in the package.
- No remaining runtime references to deleted patch files.
- Only one cloud-sync reconnect executor remains (`data-integrity.js`).
- Only one startup/auth loader owner remains (`app.js`).
