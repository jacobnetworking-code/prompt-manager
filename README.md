# Prompt Manager M1.6.6.14 — Stable Rail & Instant Desktop Restore

## Replace
- `desktop-v1.css`
- `desktop-v1.js`
- `sw.js`

## Add
None.

## Delete
None.

## SQL
None.

## Fixes
- Includes the deterministic compact rail correction: closed rail matches the `{ }` logo width exactly, first logo tap opens it, navigation clicks do not move icons, and the expanded rail is compact.
- Mobile/Auto profile is icon-only; stale/generated `Profile` labels and pseudo-labels are removed defensively.
- Persisted Desktop mode is applied immediately when `desktop-v1.js` executes instead of waiting for `DOMContentLoaded`.
- Static app-shell assets now use cache-first delivery after the release cache is installed, preventing slow network-first CSS/JS requests from exposing the raw/unrefined prompt list for several seconds after login or relaunch.
- `catalog.json` remains network-first.

## What's New
No new entry. This is a stability/visual correction to the existing M1.6.6 experience.

## Commit title
`M1.6.6.14 — Stabilize Rail & Desktop Restore`
