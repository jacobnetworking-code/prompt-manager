# Prompt Manager — M1.6.4.12

## Fix
The first compact-nav pass was technically applied, but the visual reduction on iPhone was too subtle because the iOS safe-area still dominated the total bar height.

## Changes
- Mobile nav chrome reduced more aggressively: 50px content height + iOS safe area.
- Buttons remain 44px high for usable touch targets.
- Icons/labels sit slightly lower and are vertically centered within the compact bar.
- Home spacing is tightened further so normal iPhones fit the full Home screen without scrolling when possible.
- Desktop layout is unchanged.
- No IndexedDB or Supabase schema changes.

## Commit title
M1.6.4.12 — Stronger Compact Mobile Navigation

## Replace
- ui-refine.css
- sw.js
- README.md

## Add
- none

## Delete
- none
