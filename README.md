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
