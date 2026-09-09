# Prompt Manager — M1.6.4.6

## Changes
- Featured video previews autoplay when the card is sufficiently visible.
- Videos are muted, loop continuously, play inline, and expose no playback controls.
- Off-screen videos pause automatically to reduce battery/data use and resume when visible.
- No IndexedDB or Supabase schema changes.

## Media provenance
This release changes playback behavior only. Do not label existing visual assets as exact prompt outputs unless the asset was actually generated from that card prompt. Exact prompt → output provenance remains a separate content task.

## Commit title
M1.6.4.6 — Silent Autoplay Featured Video

## Replace
- ui-refine.js
- ui-refine.css
- sw.js
- README.md

## Add
- none

## Delete
- none
