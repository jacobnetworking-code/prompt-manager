# Prompt Manager — M1.6.5.7

## Changes
- Keeps the share rule: ~20% real prompt visible, cut at a natural sentence boundary.
- Replaces generic gray blur bars with synthetic prompt-like text for the hidden ~80%.
- Synthetic text uses prompt-style structure such as Style, Subject, Lighting, Camera, Environment and Output.
- The synthetic continuation is strongly blurred and does not contain or derive from the user's hidden prompt content.
- Locked Share view still contains no Copy Prompt or Save to My Library actions.
- What's New updated to V1.6.5.7.
- No SQL/schema changes.

## Commit title
M1.6.5.7 — Prompt-Like Synthetic Share Blur

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
