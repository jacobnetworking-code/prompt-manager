# Prompt Manager M1.6.6.25

## Commit
`M1.6.6.25 — Unify Explore Card Opening & Detail Actions`

## Requires
Apply after M1.6.6.24.

## Replace
- `index.html`
- `sw.js`

## Add
- `m1.6.6.25.css`
- `m1.6.6.25.js`

## Delete
None.

## SQL
None.

## Changes
- Every Explore prompt card is tappable/clickable across Featured, search results and every category.
- Enter/Space opens focused cards on desktop.
- Opened Explore prompts show icon-only Save and Share actions in the prompt header.
- Save uses the existing catalog save flow and changes to a filled/disabled bookmark once saved.
- Share reuses the existing M1.6.6.20 public-share flow.
- Explore-specific actions are hidden when a Library prompt is opened.
- Existing M1.6.6.24 offline handling remains intact.

## QA
- `node --check m1.6.6.25.js` passed.
- `node --check sw.js` passed.
- New assets load after M1.6.6.24.
- New assets included in service-worker cache.
- Cache bumped to `pm-m1.6.6.25-v1`.
