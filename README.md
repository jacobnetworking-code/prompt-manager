# Prompt Manager M1.6.6.19

## Commit
`M1.6.6.19 — Restore Language Flags & Eliminate Desktop Load Flash`

## Replace
- `index.html`
- `sw.js`

## Add
- `m1.6.6.19.css`
- `m1.6.6.19.js`

## Delete
- `m1.6.6.18.css`
- `m1.6.6.18.js`

Do not delete the M1.6.6.18 files inside `/prompt/`; the Share page still uses those intentionally.

## What changed
- Settings language selector keeps the compact dropdown but restores the visible flag next to each language.
- `desktop-v1.css` is now loaded synchronously in `<head>` instead of waiting for `ui-refine.js` to inject it. This removes the unstyled/intermediate desktop frame that could expose prompt content for a moment during startup.
- Expanded desktop navigation continues to show `Prompt Manager` beside the `{ }` logo.
- Share-page language/header behavior from M1.6.6.18 is unchanged.
- Service-worker cache bumped to `pm-m1.6.6.19-v1`.

## SQL
None.

## QA
- JavaScript syntax checked.
- Service-worker syntax checked.
- Confirmed `desktop-v1.css` is present in `<head>` with `data-pm-desktop-v1`.
- Confirmed Settings options contain 🇬🇧 / 🇪🇸 / 🇷🇸.
- Confirmed M1.6.6.19 assets are pre-cached.
