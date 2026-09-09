# Prompt Manager — M1.6.5.8

## Changes
- Locked Share preview keeps ~20% of the real prompt visible.
- The visible portion is allowed to end mid-sentence; blur starts only on the next visual line.
- Hidden ~80% is represented by safe synthetic continuation prose, not the private prompt.
- Synthetic continuation now uses the same typography, size and line rhythm as the visible prompt so it reads visually as one continuous prompt.
- Synthetic continuation length scales approximately with the visible portion.
- Copy Prompt and Save to My Library are absent from the locked/public Share view.
- No SQL/schema changes.

## Commit title
M1.6.5.8 — Seamless Locked Share Preview

## Replace
- prompt/index.html
- prompt/share.js
- prompt/share.css
- ui-refine.js
- sw.js
- README.md

## Add
- none

## Delete
- none
