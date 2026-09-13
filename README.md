# Prompt Manager M1.6.6.12 — Compact Rail & Library Controls

Incremental update over M1.6.6.11.

## Commit title
`M1.6.6.12 — Refine Compact Rail & Library Controls`

## Replace
- `desktop-v1.css`
- `desktop-v1.js`
- `sw.js`

## Add
None.

## Delete
None.

## SQL
None.

## Included
- Mobile/Auto profile returns to the original icon-only button; generated `Profile` text is removed outside compact Desktop mode.
- Compact Desktop logo remains a stable square trigger when the rail expands.
- Compact rail width reduced from 148px to 132px.
- More breathing room between navigation icons and labels.
- Removed the iOS width-morph that could show a malformed first-open navigation state.
- Library `+` action is a true 46x46 square.
- Library Select action is narrower while preserving readable text.
- Existing safe-area / Dynamic Island positioning remains intact.

## What’s New
No separate entry. This is a visual refinement of the existing M1.6.6 desktop experience.

## QA
- `desktop-v1.js` syntax checked with Node.
- `sw.js` syntax checked with Node.
- CSS brace balance checked.
- Service-worker cache: `pm-m1.6.6.12-v1`.
