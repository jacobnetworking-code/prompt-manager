# Prompt Manager — M1.6.4.10

## Bug fixed
Featured images were not rendering because:
1. `Image Prompt Builder` referenced `image-builder-example.jpg`, while the actual GitHub file is `image-builder-example.PNG`.
2. The service worker precached every old/new media asset with one `cache.addAll(...)`. Any missing historical asset made the entire service-worker install fail, leaving stale cache behavior active.

## Changes
- Corrects the Image Prompt Builder filename/case.
- Adds cache-busting query strings to all Featured media.
- Replaces brittle media precaching with core-only precaching.
- Media is cached at runtime only after a successful HTTP response.
- A missing optional asset can no longer block a service-worker update.
- Keeps Celebrity Video Prompt second in Featured.
- Keeps the real Seedance video, autoplay/muted/loop/no-controls.
- No IndexedDB or Supabase schema changes.

## Commit title
M1.6.4.10 — Fix Featured Image Loading & PWA Cache

## Replace
- ui-refine.js
- sw.js
- README.md

## Add
- none

## Delete
- none required
