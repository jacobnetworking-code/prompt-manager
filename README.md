# Prompt Manager — M1.6.6.6 Persistent Sidebar & Dynamic Login

## User-facing changes
- Desktop sidebar expands/collapses only when the Prompt Manager `{ }` logo is clicked.
- Hover no longer changes sidebar width; it only keeps the restrained Dock-style icon response.
- Expanded/collapsed preference is stored locally and survives sign-out/sign-in and browser restarts.
- Expanded state visibly restores Prompt Manager / ALPHA, Home, Explore, Library and Account labels.
- Desktop login now previews the product with animated rows of public catalog prompt cards behind the sign-in card.
- Login background is deliberately darkened and softened so authentication remains the visual focus.
- Reduced-motion users get a static backdrop.
- Mobile/tablet login and navigation remain unchanged.

## Privacy / security
- The logged-out backdrop uses only public `catalog.json` content.
- Personal library prompts are never rendered before authentication.

## What's New
No new What's New entry. This refines the existing M1.6.6 desktop experience.

## Commit title
M1.6.6.6 — Persistent Sidebar & Dynamic Login

## Replace
- desktop-v1.css
- desktop-v1.js
- index.html
- sw.js

## Add
- none

## Delete
- none

## SQL
- none

## QA
- desktop-v1.js remains loaded exactly once from index.html.
- Sidebar state uses `pm-desktop-sidebar-expanded` in localStorage and is not cleared on logout.
- Legacy hover expansion is explicitly neutralized at desktop breakpoints.
- Login prompt backdrop reads only catalog.json and fails gracefully if unavailable.
- Service-worker cache bumped to pm-m1.6.6.6-v1.
