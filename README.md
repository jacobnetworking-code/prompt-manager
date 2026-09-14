# Prompt Manager M1.7.5

Pre-launch Library correctness pass.

## Replace
- `product-ui.js`
- `product-ui.css`
- `sw.js`

## Add
- None

## Delete
- None

## SQL
- None

## Changes
- Replaces the Library `…` text glyph with a geometrically centered SVG icon.
- Adds `Imported` as a distinct Library origin while keeping legacy bulk imports compatible through the existing `Bulk import` provenance marker.
- Adds a subtle Imported badge to imported prompt cards.
- Bulk Import now creates a missing category before assigning imported prompts to it.
- Adds deterministic prompt-text duplicate detection. Exact/near matches at 90%+ trigger a review proposing `Delete newest` or `Keep both`; nothing is deleted automatically.
- Existing exact duplicate skipping in Bulk Import remains in place. Similarity warnings generated during bulk import are queued until the import sheet closes.

## QA
- `node --check product-ui.js`
- `node --check sw.js`
- Verify Library origin tabs: All / Added / Saved / Imported.
- Verify legacy Bulk import prompts appear only under Imported, not Added.
- Import a prompt with a new category and verify the category is created.
- Add an exact duplicate and a >90% near duplicate; verify review dialog and Delete newest.
- Add two genuinely related but materially different prompts; verify no false warning below threshold.
- Verify Library More icon centering and anchored menu on mobile and desktop.
