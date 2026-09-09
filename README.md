# Prompt Manager — M1.6.5.9

## Changes
- Locked Share preview now renders the hidden ~80% as one continuous synthetic text block.
- The blurred continuation uses the exact same font family, font size, line-height, width and horizontal padding as the visible prompt.
- No headings, fake sections, bars, staggered widths or formatting changes are used in the blurred continuation.
- Blur begins on the next full line after the visible teaser.
- Synthetic continuation length is approximately 4× the visible teaser length, matching the 20/80 visual rule.
- Hidden real prompt content is still never sent to anonymous clients.
- Locked view remains free of Copy Prompt and Save to My Library.
- No SQL/schema changes.

## Commit title
M1.6.5.9 — Seamless Full-Text Share Blur

## Replace
- prompt/share.js
- prompt/share.css
- ui-refine.js
- sw.js
- README.md

## Add
- none

## Delete
- none
