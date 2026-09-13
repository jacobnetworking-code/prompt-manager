# Prompt Manager M1.7.4

Commit: `M1.7.4 — Polish Library Menu & Refresh What's New`

## Replace
- `product-ui.css`
- `product-ui.js`
- `sw.js`

## Add
None.

## Delete
None.

## SQL
None.

## Changes
- Centers the three-dot Library button horizontally and vertically.
- On mobile, the Library overflow menu now opens directly below and aligned to the three-dot button instead of at the bottom of the screen.
- Refreshes What's New to V1.7 with user-visible features only:
  - Bulk Import
  - Category Management
  - Offline Library
- What's New copy localized in EN / ES / SR.

## QA
- Stable runtime filenames preserved.
- JS syntax checked.
- Service worker syntax checked.
- Cache bumped to `pm-m1.7.4-v1`.
