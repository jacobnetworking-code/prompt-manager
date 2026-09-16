# Prompt Manager M1.7.12.2 — Transient Library Quick Search

- Search icon opens a standalone temporary Library search.
- It does NOT expand/collapse Filters.
- Input is focused immediately so iOS opens the keyboard.
- Search uses the existing Library search pipeline in real time.
- Tapping outside closes Quick Search and clears the query.
- Leaving Library / app background-close resets the transient query.
- Filter expanded/collapsed preference remains persistent and independent.

Replace:
- library-controls.js
- product-ui.css
- sw.js

Add/Delete/SQL: none

Commit:
M1.7.12.2 — Add Transient Library Quick Search
