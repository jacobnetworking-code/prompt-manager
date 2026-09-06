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


## M1.5.5 — component reset
- Brand and Settings icons rebuilt with controlled SVG geometry.
- Welcome Tour rebuilt with a full-screen SVG cutout mask and gold target outline.
- Fixed safe-area coach card; no target-dependent bubble positioning.
- DB v2 / Backup v4 / catalog unchanged.


## M1.5.6
- Welcome Tour removed completely.
- Header opens Profile.
- Profile exposes System / Light / Dark immediately.
- Settings contains local display name, Backup & Restore, and Storage Diagnostics.
- No account/auth and no What's New.
- DB v2 / Backup v4 / Explore catalog unchanged.


## M1.5.7 — brand polish
- Removes `PERSONAL ALPHA` from the header.
- Enlarges `Prompt Manager` beside the logo.
- Adds a compact gold `Alpha` badge.
- Removes the repeated `PROMPT MANAGER` label above the Home headline.
- No functional or storage changes.


## M1.5.8
- X in Fast Capture discards unsaved form values.
- `Use with` copies the ready prompt, records use, then opens the selected AI service via its HTTPS entry point. On iOS, supported universal-link handling may open an installed app; otherwise the web service opens.
- Optional 1–5 star rating for every prompt in Library, regardless of acquisition source. Tap the current rating again to clear it.
- Manual prompts explicitly store `acquisitionType: "manual"` and `rating: null`.
- DB v2 / Backup v4 unchanged.


## M1.5.8.1 — ChatGPT native-app launch
- `Use with ChatGPT` still copies the ready prompt first.
- It now launches the installed ChatGPT iOS app through the `chatgpt://` custom URL scheme instead of navigating to chatgpt.com.
- This is intentionally limited to ChatGPT in this hotfix; other AI launchers are unchanged until their native routes are separately validated.
- DB v2 / Backup v4 unchanged.

## M1.6.1 — Cloud Identity Foundation
- Adds Supabase Auth using the project's publishable key.
- Google OAuth primary sign-in.
- Email passwordless magic-link fallback.
- Adds sign-out.
- Existing IndexedDB prompts remain local and untouched.
- No cloud prompt sync yet.
- DB v2 / Backup v4 unchanged.


## M1.6.1.1 — Auth loading hotfix
- Fixes missing Supabase JS SDK load before `app.js`.
- Login screen is now visible by default and only hides after a valid session is confirmed.
- Adds visible authentication-load error instead of silently bypassing the login screen.
- Adds `Sign out` to the top-right profile menu.
- Existing IndexedDB library remains untouched.


## M1.6.1.2 — OAuth callback recovery
- Explicitly recovers the Supabase session from the OAuth callback URL fragment.
- Persists `access_token` + `refresh_token` with `setSession()` before checking auth state.
- Cleans auth tokens out of the browser URL after successful recovery.
- Fixes the Safari login loop where a successful Google sign-in returned to the login screen.


## M1.6.1.3 — OAuth session race fix
- Removes manual OAuth token recovery and `setSession()` from the callback path.
- Lets supabase-js handle the OAuth callback natively via `detectSessionInUrl`.
- Removes the re-entrant `onAuthStateChange -> getSession -> onAuthStateChange` pattern.
- Auth UI now reacts directly to the session supplied by Supabase.
- Intended to fix the observed behavior where the app appeared briefly and then returned to login.


## M1.6.1.4 — Auth bootstrap ordering + session stability
- Auth gate now exists in the DOM before application JavaScript runs.
- Supabase/app scripts use `defer`, removing the startup flash caused by parser ordering.
- A valid session is server-verified with `getUser()` before the app is opened.
- Transient null auth events no longer overwrite an already-valid session.
- Only an explicit `SIGNED_OUT` event closes an authenticated session.
- IndexedDB schema/data remain unchanged.


## M1.6.2 — Local → Cloud migration + sync

Architecture:
- Supabase is the source of truth for personal prompts.
- IndexedDB remains the local cache/offline working store.
- IndexedDB upgraded from DB v2 to DB v3 only to add `syncQueue`; the existing
  `prompts` and `categories` stores are preserved in place.
- Backup format remains v4.

First authenticated migration:
- If the authenticated user's Supabase library is empty, existing local prompts
  are uploaded once and linked to their generated cloud UUIDs.
- If the user's cloud library already contains prompts, cloud data replaces the
  local prompt cache. This prevents one account's stale device cache from being
  silently uploaded into another account.
- Migration state is namespaced per Supabase user.

Ongoing behavior:
- Online creates/updates/deletes write to Supabase and update IndexedDB.
- Offline mutations are written locally and queued in IndexedDB.
- The queue retries when connectivity returns.
- Successful sync refreshes the local cache from Supabase.
- RLS remains the security boundary: every cloud query runs as the authenticated user.

Scope deliberately excluded:
- No realtime subscriptions yet.
- No multi-device conflict UI yet.
- No community/public prompt tables.
