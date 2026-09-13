# Prompt Manager M1.7.3 — Runtime Consolidation

Commit: `M1.7.3 — Consolidate Versioned Runtime Assets`

## Purpose
This is a maintenance release with no intentional product/UX change.

From this release onward, version history belongs in Git, not in runtime filenames.

## Replace
- `index.html`
- `sw.js`

## Add
- `product-ui.css`
- `product-ui.js`

## Delete
- `m1.6.6.18.css`
- `m1.6.6.18.js`
- `m1.6.6.19.css`
- `m1.6.6.19.js`
- `m1.6.6.20.css`
- `m1.6.6.20.js`
- `m1.6.6.21.css`
- `m1.6.6.21.js`
- `m1.6.6.22.js`
- `m1.6.6.24.css`
- `m1.6.6.24.js`
- `m1.6.6.25.css`
- `m1.6.6.25.js`
- `m1.7.0.css`
- `m1.7.0.js`
- `m1.7.1.css`
- `m1.7.1.js`
- `m1.7.2.css`
- `m1.7.2.js`

Do NOT delete `/prompt/share-m1.6.6.18.css`; that is a separate share-page asset.

## SQL
None.

## Architecture after this release
Core:
- `app.js`
- `styles.css`

UX / presentation:
- `ui-refine.js`
- `ui-refine.css`
- `desktop-v1.js`
- `desktop-v1.css`
- `product-ui.js`
- `product-ui.css`

From now on, new work should replace these stable files rather than create `mX.Y.Z.*` runtime files.

## QA
- Consolidated JS preserves the exact historical script order and IIFE boundaries.
- `node --check product-ui.js` passed.
- `node --check sw.js` passed.
- `index.html` contains no versioned root runtime references.
- `sw.js` contains no obsolete versioned root runtime cache entries.
- Service-worker cache bumped to `pm-m1.7.3-v1`.
