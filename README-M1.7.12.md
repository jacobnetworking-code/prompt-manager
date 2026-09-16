# Prompt Manager M1.7.12 — Compact Library Filters

Implements the agreed Library header interaction:
- Filter icon immediately left of More (•••), same 44×44 control size as More and Add.
- Quick Search icon vertically above Filter.
- Prompt count remains vertically above Add.
- Filter toggles the entire filter region: origin, categories, Search/Platform/Model.
- Expanded/collapsed state persists in localStorage across app closes and sign-in sessions.
- Search/filter values themselves remain ephemeral.
- Quick Search expands filters when needed and focuses Search.
- Expanded Filter gets a subtle gold active state.

Replace:
- index.html
- product-ui.css
- sw.js

Add:
- library-controls.js

Delete: none
SQL: none

Commit:
M1.7.12 — Add Persistent Compact Library Filters
