# Prompt Manager — M1.6.4.5

## Fix
The Featured assets existed in the repository, but the Featured renderer still hardcoded the old decorative cover and never inserted `previewImage` / `previewVideo` into the card.

This release fixes that renderer.

## Changes
- Featured image/video previews now render in the top area of the card.
- Category + FEATURED badge overlays the media.
- Added a local cinematic poster asset for current Video Featured prompts.
- Expanded preview mapping to current visual Featured items.
- PWA cache bumped to `pm-m1.6.4.5-v1`.
- No IndexedDB or Supabase schema changes.

## Commit title
M1.6.4.5 — Fix Featured Media Rendering

## Deploy
Upload every file/folder from this ZIP to the repository root, including `featured/`.
