# Prompt Manager — M1.6.5.5

## Changes
- Tightens the locked Share preview by removing the large unused vertical gap.
- Moves the lock/CTA/sign-in block upward directly below the blurred prompt continuation.
- Makes the synthetic blur look more like dense underlying prompt text while remaining unreadable.
- Keeps anonymous security unchanged: hidden prompt content is still never sent to the browser.
- Keeps the sentence-aware ~20% visible teaser rule.
- What's New updated to V1.6.5.5.
- No SQL/schema changes.

## Commit title
M1.6.5.5 — Compact Share Preview & Text Blur

## Replace
- prompt/share.css
- ui-refine.js
- sw.js
- README.md

## Add
- none

## Delete
- none
