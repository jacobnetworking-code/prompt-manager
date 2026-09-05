# Prompt Manager — Personal Alpha

## M1.3 — Fast Capture + Categories

- One-tap clipboard Paste with iOS fallback
- Prompt text or source URL capture
- Required editable short title with local provisional suggestion
- Default + custom categories
- Remembers last-used category and filters Library
- IndexedDB migration v1 → v2 preserving prompts
- Backup v2 includes categories
- Restore supports M1.2 backup v1 and M1.3 backup v2
- Offline PWA
- No backend, login, cloud sync, AI API, or client-side secrets

Before deployment, export and keep a verified M1.2 backup. After deployment validate migration, capture, v2 backup/restore, duplicate protection, persistence and offline launch.


## M1.3.1
- iOS PWA viewport hardening: disables page zoom and horizontal page scrolling.
- Inputs use 16px text to prevent Safari focus auto-zoom.
- IndexedDB schema remains version 2; no data model or business-logic changes.
- Service worker cache bumped to pm-m1.3.1-v1.


## M1.3.2 — Storage Diagnostics
Adds a read-only diagnostics panel for origin/display mode, IndexedDB name/version/stores/counts, persistence status, storage estimate, service worker state and cache keys. No database schema or prompt write logic changes.


## M1.4 — Use Loop + Platform
Platform filtering, local [VARIABLE] personalization, usage tracking, and v3 backups. IndexedDB remains v2.


## M1.4.1 — App Shell + Brand + Settings
- New `{ }` gold-on-charcoal brand mark.
- Home / Explore / Library bottom navigation.
- Settings consolidates Appearance, Backup & Restore, and Storage Diagnostics.
- Library search and platform selector share one row.
- Platform label `General` becomes `Multiplatform` while retaining the internal `general` ID for backward compatibility.
- Explore is intentionally a placeholder until M1.5.
- IndexedDB remains v2 and backup format remains v3.


### M1.4.1 brand icon hotfix
- Added explicit 180×180 `apple-touch-icon.png` for iOS Home Screen.
- Added 192×192 and 512×512 PWA icons.
- Updated manifest icon declarations.
- Service Worker cache bumped to `pm-m1.4.1-brand-v3`.


## M1.5 — Explore v1
- Explore uses the public prompts.chat REST search/list API; no API key.
- Catalog prompts stay external until the user explicitly saves one.
- Library distinguishes All / Added / Saved without asking the user for metadata.
- Legacy/manual prompts are treated as Added.
- Saved Explore prompts store provenance (`acquisitionType`, `sourceName`, `externalId`).
- Backup format v4 preserves provenance; v1-v3 restore remains supported.
- Welcome Tour v1 is shown once per local installation and can be replayed from Settings.
- Home vertical start aligned with Explore/Library.
- IndexedDB schema remains v2; no authentication/backend added.


## M1.5.1
- Removes runtime dependency on prompts.chat API. Explore reads a PM-owned static `catalog.json`.
- Visual 3-column purpose categories + search; no extra filter layer.
- Contextual 3-step Welcome Tour highlights the real Add, Explore and Library UI.
- Catalog is cached by the service worker for offline use after first update load.
- No DB migration. Backup remains v4.


## M1.5.2 — UX polish
- Welcome Tour uses Visual Viewport-aware placement and four blur shade panels, leaving the highlighted target crisp.
- Gold spotlight uses the same brand gold and bubble placement chooses above/below based on measured free space.
- Explore category grid is fully hidden while viewing a category; `← Categories` restores it.
- Library header adds a discreet gold `+` capture action.
- DB v2 and Backup v4 unchanged.


## M1.5.3
- Welcome Tour bubble uses deterministic viewport-safe centered positioning; target remains gold-highlighted and unblurred.
- Explore back-to-categories header is explicitly absent until a category is open.
- Bottom navigation icons increased while labels remain.
- Static seed catalog expanded from 30 to 84 prompts.
- DB v2 / Backup v4 unchanged.


## M1.5.4
- Rebuilt Welcome Tour coach card as a fixed safe-area bottom card; only spotlight geometry follows targets.
- Library title/count and subtitle/add button use a two-row grid for exact alignment.
- Brand mark and Settings glyph use explicit grid centering.
- DB v2 / Backup v4 / catalog unchanged.
