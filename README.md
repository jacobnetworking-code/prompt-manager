# Prompt Manager — M1.6.4.8

## Changes
- Added one real Seedance 2.0 video example to Featured.
- The video is linked to the single `Cinematic Video Prompt` Featured card (`pc-021`).
- Video autoplays only while visible, muted, looped, inline, and with no player controls.
- The GitHub asset is a web-optimized H.264 MP4 with the audio track removed.
- Removed the other placeholder video cards from Featured for now.
- No IndexedDB or Supabase schema changes.

## Commit title
M1.6.4.8 — Real Seedance Featured Video

## Replace
- ui-refine.js
- sw.js
- README.md

## Add
- featured/seedance-arrival-example.mp4

## Delete
- none required

## Optional cleanup
`featured/cinematic-video.svg` is no longer used by Featured and can be deleted.
