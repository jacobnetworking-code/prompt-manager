# Prompt Manager M1.6.6.9 — Unified Responsive Settings

Incremental update built on the pushed M1.6.6.8 baseline (`3a3cc018c4359719194cd13888811e84adeba972`).

## Replace
- `desktop-v1.css`
- `sw.js`

## Add
None.

## Delete
None.

## SQL
None.

## User-facing change
- Settings now uses the same information architecture on mobile and desktop: Profile, Appearance, Interface, Data and Sign out.
- Desktop keeps the centered macOS/iOS-style window introduced in M1.6.6.8.
- Mobile/tablet uses the same Settings content in an iOS-style high bottom sheet with touch-friendly controls and safe-area spacing.
- Interface selection remains Auto / Mobile / Desktop and continues to persist locally.
- No Explore, Library, data model or authentication behavior changed in this release.

## What’s New
No separate entry. This is a consistency refinement of the M1.6.6 experience.

## Commit title
`M1.6.6.9 — Unify Responsive Settings`

## QA
- CSS braces balanced.
- Service worker cache bumped to `pm-m1.6.6.9-v1`.
- Settings mobile rules are scoped below 1024px and do not alter the desktop modal.
- Existing M1.6.6.8 Settings logic and persisted interface preference are reused; no duplicate settings implementation was added.
