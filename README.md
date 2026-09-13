# Prompt Manager M1.6.6.15 — Rail State & Explore Fixes

## Commit title
`M1.6.6.15 — Fix Rail State & Explore Featured Flow`

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
- Mobile/Auto profile is icon-only; historical profile pseudo-labels are disabled globally.
- Forced-desktop compact rail now opens on the first logo tap using an authoritative direct state and fixed width.
- Compact rail icons no longer move when Home / Explore / Library is tapped.
- Collapsed rail width matches the logo exactly; expanded rail is 124px.
- Explore and Library title blocks are vertically aligned with Home in forced-desktop layouts.
- Featured mode now fully hides categories while Featured results are displayed.
- Service-worker cache bumped to `pm-m1.6.6.15-v1`.

## QA
- `node --check desktop-v1.js`
- `node --check sw.js`
- CSS brace balance passed.
- Featured `[hidden]` state has an explicit `display:none!important` guard.
- Sidebar first-click handler runs in capture phase and stops competing handlers.
