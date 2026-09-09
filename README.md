# Prompt Manager — M1.6.4.14

## Changes
- Mobile nav icons replaced with normalized SVGs at identical 24×24 visual size.
- Icon + label are centered as one block and moved slightly upward within the compact nav.
- Home main title now aligns with the main title level used by Explore and Library.
- Home spacing is redistributed across hero, description/button, action cards, and What's New.
- Library subtitle aligns vertically with Select.
- Library separator spacing is balanced above/below.
- Background page scroll is locked whenever any prompt/settings/dialog sheet is open; only the open sheet scrolls.
- What's New now uses explicit release metadata and updates to the current relevant release version/highlights.
- No IndexedDB or Supabase schema changes.

## Not included yet
- Shareable prompt permalinks: requires an explicit public-sharing data model because personal prompts are currently private under RLS.
- Public rating counts: requires aggregate/community rating data; showing a count from private personal ratings would be misleading.

## Commit title
M1.6.4.14 — Mobile Layout Polish & Modal Scroll Lock

## Replace
- index.html
- ui-refine.css
- ui-refine.js
- sw.js
- README.md

## Add
- none

## Delete
- none
