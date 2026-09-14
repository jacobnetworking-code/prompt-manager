# Prompt Manager M1.7.6

Pre-launch friction polish for Library.

## Replace
- `product-ui.css`
- `product-ui.js`
- `sw.js`

## Add
None.

## Delete
None.

## SQL
None.

## Changes
- Keeps `All · Added · Saved · Imported` on a single row on mobile, resizing the four origin controls to fit the available width.
- Adds an `Import prompts` action directly inside the `No prompts found` empty state.
- The empty-state import action opens the existing Bulk Import flow, so there is no duplicate import implementation or new data path.
- Localized in English, Spanish and Serbian.
- No schema, storage or data migration changes.

## QA
- iPhone/mobile: confirm all four origin controls stay on one line without horizontal scrolling or wrapping.
- Check narrow mobile widths (~375px) and larger iPhones.
- Select `Imported` with no imported prompts and confirm `Import prompts` appears below the empty-state copy.
- Tap `Import prompts` and confirm the existing JSON/CSV Bulk Import dialog opens.
- Verify the CTA also behaves correctly when another search/filter combination returns no results.
- Change language EN/ES/SR and confirm CTA copy updates.
- Desktop: confirm origin filters and Library layout remain unchanged apart from the empty-state CTA.
