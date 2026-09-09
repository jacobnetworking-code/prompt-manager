# Prompt Manager — M1.6.4.1 UX Polish, Language & Featured

Complete replacement package. Upload every file in this ZIP to the repository root and replace files with the same names. No manual code edits are required.

## Included
- English / Spanish language selector in Settings with inline flag icons
- Name Save button aligned with the name input
- Platform filter bug fixed; every platform is selectable even with zero matching prompts
- Featured is now a functional Explore destination with a curated visual card layout
- Library Select moved beside the + action; multi-delete uses a contextual bottom bar
- Library cards redesigned with Edit/Delete top-right and larger Copy/Share actions at the bottom
- Platform remains visible as a badge next to category
- What's New redesigned as an editorial release-note section with V1.6.4 and key updates
- Incorrect prompts.chat provenance removed from the PM-generated seed catalog
- Backup restore errors use Prompt Manager UI instead of browser alert()
- Service worker cache bumped to M1.6.4.1

## Data
No IndexedDB or Supabase schema changes. Existing cloud/local prompt data remains compatible.

## QA2 correction
- Fixed catalog saved-state detection for Prompt Manager seed items, preventing duplicate saves from Explore/Featured.
- Service worker cache bumped to `pm-m1.6.4.1-v2`.
