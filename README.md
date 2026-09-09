# Prompt Manager — M1.6.4.9

## Changes
- Adds five independent 16:9 Featured example images as local GitHub assets.
- Celebrity Video Prompt is now the second Featured card.
- Celebrity Video Prompt uses the real Seedance 2.0 MP4 and has no fallback image.
- Renames `Video Concept` to `Celebrity Video Prompt`.
- Updates the Celebrity Video Prompt content to the exact prompt used for the real video example.
- No IndexedDB or Supabase schema changes.

## Featured order
1. Image Prompt Builder
2. Celebrity Video Prompt
3. Portrait Prompt
4. Architecture Visual
5. Fashion Editorial
6. Logo Concept

## Commit title
M1.6.4.9 — Independent Featured Examples & Celebrity Video

## Replace
- ui-refine.js
- sw.js
- catalog.json
- README.md

## Add
- featured/image-builder-example.jpg
- featured/portrait-example-real.jpg
- featured/architecture-example-real.jpg
- featured/fashion-editorial-example.jpg
- featured/logo-concept-real.jpg

## Delete
- none required

## Optional cleanup after validation
- featured/image-prompt-builder.svg
- featured/portrait-prompt.svg
- featured/architecture-visual.svg
- featured/portrait-example.png
- featured/fashion-editorial-example.png
- featured/architecture-example.png
- featured/cinematic-video.svg
