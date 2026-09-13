# Prompt Manager M1.6.6.10 — Responsive Desktop Mode

Incremental update over M1.6.6.9.

## User-facing change
- Forced Desktop on iPhone/iPad no longer requests a fake 1180px viewport.
- Desktop mode now keeps the real device viewport and adapts the desktop UI to available width.
- Compact screens use a narrow desktop rail, fluid content width, responsive cards and compact spacing.
- Landscape phones progressively gain denser two-column desktop layouts where space allows.
- Expanded desktop navigation overlays on compact screens instead of pushing the workspace off-screen.
- Settings remains centered when Desktop mode is forced on a phone.
- Horizontal app overflow is explicitly prevented.

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

## What's New
No separate entry. This fixes/refines the existing Interface mode introduced in M1.6.6.8–9.

## Commit title
`M1.6.6.10 — Make Desktop Mode Fully Responsive`

## QA
- `node --check desktop-v1.js`
- `node --check sw.js`
- CSS brace balance = 0
- Forced desktop no longer writes `width=1180` to the viewport meta tag.
- Compact desktop CSS covers portrait and landscape widths below 1024px.
- Service worker cache: `pm-m1.6.6.10-v1`
