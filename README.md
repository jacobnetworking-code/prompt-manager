# Prompt Manager — M1.6.4.11

## Changes
- Bottom navigation is ~18% more compact on mobile.
- Icons/labels are vertically centered lower inside the compact nav while touch targets remain >=48px.
- Home is vertically tightened to fit a normal iPhone viewport without scrolling when content fits.
- Scroll remains available on small screens, long translations, and accessibility layouts.
- Adds a responsive desktop layout in the same PWA/codebase.
- Desktop uses a compact left navigation rail and a two-column Home dashboard.
- Explore/Library expand to wider desktop layouts.
- No IndexedDB or Supabase schema changes.

## Architecture
Desktop is responsive web layout, not a separate desktop application. This keeps one product, one deployment, one auth/sync layer, and one UI codebase.

## Commit title
M1.6.4.11 — Compact Navigation & Responsive Desktop

## Replace
- ui-refine.css
- ui-refine.js
- sw.js
- README.md

## Add
- none

## Delete
- none
