# Prompt Manager M1.6.6.20

## Commit
`M1.6.6.20 — Open Featured Cards & Share Explore Prompts`

## Replace
- `index.html`
- `sw.js`

## Add
- `m1.6.6.20.css`
- `m1.6.6.20.js`

## Delete
None.

Keep M1.6.6.19 assets in place because this update layers on top of them.

## What changed
- Featured cards are now fully clickable, matching the Library interaction: clicking the card opens the prompt.
- Featured cards are keyboard accessible with Enter/Space.
- Every catalog prompt shown in Explore/category results now gets a Share button even when it has not been saved to Library.
- Featured prompts also get the same Share button.
- Sharing an unsaved catalog prompt does **not** silently save it to Library.
- Catalog shares reuse an existing public share for that user + catalog prompt using an internal `catalog:<id>` marker, so repeated shares do not create unnecessary duplicate links.
- Existing Library sharing is untouched.
- Service-worker cache bumped to `pm-m1.6.6.20-v1`.

## SQL
None.

## QA
- JavaScript syntax checked.
- Service-worker syntax checked.
- Confirmed M1.6.6.20 CSS/JS are loaded after M1.6.6.19.
- Confirmed new assets are included in the service-worker cache.
- Confirmed Featured card clicks ignore action buttons so Save/Share do not accidentally open the prompt.
