# Prompt Manager M1.6.6.11 — Compact Safe-Area Desktop Rail

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

## Included
- Compact phone Desktop rail now ends directly after its controls instead of stretching to the bottom of the viewport.
- Profile moves directly below Library inside the compact rail when Desktop mode is forced on screens below 1024px.
- Landscape phone Desktop mode respects `safe-area-inset-left/right`, keeping the rail clear of the Dynamic Island / camera cutout in either orientation.
- Expanded compact rail reduced from 184px to 148px, with tighter icon/label spacing and stable clipping during expansion.
- Library `Select / Seleccionar` control gets a larger minimum width and horizontal padding.
- Native desktop and normal Mobile/Auto layouts remain unchanged.
- Service-worker cache bumped to `pm-m1.6.6.11-v1`.

## What's New
No new entry. This is a compact-desktop visual refinement within M1.6.6.

## Commit title
`M1.6.6.11 — Compact Safe-Area Desktop Rail`

## QA
- `desktop-v1.js` syntax checked with Node.
- `sw.js` syntax checked with Node.
- CSS brace balance checked.
- Profile relocation preserves the existing DOM node/listeners and restores it to the header outside compact forced Desktop mode.
- Safe-area positioning is CSS-driven, so flipping landscape orientation automatically protects the opposite side.
