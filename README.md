# Prompt Manager — M1.6.5.10

## Changes
- The visible teaser now intentionally ends mid-sentence to create curiosity.
- It still cuts at a word boundary, never through a word.
- The blurred continuation begins on the next visual line.
- Public share metadata now stores only `total_length` (character count), not hidden prompt text.
- The synthetic blurred continuation length is generated to approximately match:
  `original prompt length - visible teaser length`.
- This makes the full preview visually approximate the original prompt's total character length.
- Hidden real prompt content remains inaccessible to anonymous users.
- Locked view still has no Copy Prompt / Save to My Library.
- Requires one small SQL migration.

## Commit title
M1.6.5.10 — Curiosity Cut & Original-Length Share Preview

## Replace
- ui-refine.js
- prompt/share.js
- sw.js
- README.md

## Add
- m1.6.5.10-share-total-length.sql

## Delete
- none

## Deploy order
1. Run `m1.6.5.10-share-total-length.sql` in Supabase SQL Editor.
2. Upload the replacement files to GitHub.
3. Re-share an existing prompt once so its `total_length` is populated correctly.
