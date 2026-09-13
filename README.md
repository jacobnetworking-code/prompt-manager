# Prompt Manager M1.6.6.18 — Language & Brand Polish

Commit: `M1.6.6.18 — Refine Language UX & Share Header`

## Replace
- `index.html`
- `sw.js`
- `prompt/index.html`
- `prompt/share.js`

## Add
- `m1.6.6.18.css`
- `m1.6.6.18.js`
- `prompt/share-m1.6.6.18.css`

## Delete
None.

## SQL
None.

## Changes
- Settings language control is now a single dropdown showing the current language.
- Shared prompt header keeps ALPHA beside Prompt Manager and adds a flag-only language menu on the right.
- Shared prompt UI translates between English, Spanish and Serbian and shares the same `pm-language` preference.
- Compact desktop sidebar shows Prompt Manager branding beside the logo while expanded.
- Service-worker cache bumped to `pm-m1.6.6.18-v1`.

## QA
- JS syntax checked for `m1.6.6.18.js`, `prompt/share.js`, and `sw.js`.
- Main index loads the new polish CSS/JS after existing desktop assets.
- Share header has accessible language controls.
