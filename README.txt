Prompt Manager — M1.6.4 UI refinement

STATUS
Prepared, not deployed.

WHY NOT DEPLOYED YET
This refinement introduces edit/delete/bulk-delete interactions. It does not change the
IndexedDB or Supabase schema, but it can modify user data through the UI. Per the project's
storage safety rule, export a valid Prompt Manager backup before activating it on GitHub Pages.

FILES
- ui-refine.js
- ui-refine.css

ACTIVATION (after backup)
1. Add to <head>, after styles.css:
   <link rel="stylesheet" href="./ui-refine.css">
2. Add after app.js:
   <script src="./ui-refine.js" defer></script>
3. Add both files to the service-worker asset list and bump the cache version.

IMPLEMENTED
- Visible tap feedback on buttons.
- Inline success states for Save / Copy / Export / Diagnostics copy.
- App-native confirmation dialog for Delete; no browser confirm().
- App-native error/info dialog foundation.
- Tap backdrop to close sheets/modals while retaining X.
- Full prompt card opens prompt.
- Apple-style SVG icons: Copy, Share, Edit, Delete.
- Share uses native Web Share sheet where supported; fallback copies.
- Edit prompt dialog + save.
- Immediate/optimistic Library refresh on delete.
- Bulk Select + Delete with custom confirmation.
- Profile defaults to authenticated Google name/email until custom name is saved.
- Add Prompt resets to General + Multiplatform on close/save.
- Explore resets to category root whenever user re-enters.
- Home What's New card (informational only, no tour).
- Explore uses Featured rather than fake Trending until real behavioral signals exist.
- Preview Image/Video rendering is supported when catalog entries later contain previewImage/previewVideo.

NOT INCLUDED YET
- The requested 50+ high-quality prompts per Explore category.
  Deliberately not generated as filler. The next catalog pass should ingest/curate the current
  CC0 prompts.chat dataset and assign PM categories deterministically/with a quality pass.
- Actual visual previews. The UI/model hook is ready, but we should only attach previews we
  have rights to use or generate ourselves.
- Import from ChatGPT UI. Deferred until Prompt Manager is publicly installable/distributable.
