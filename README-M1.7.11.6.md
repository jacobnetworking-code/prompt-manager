# Prompt Manager M1.7.11.6

Root-cause UI correction for Library Platform / Model controls.

Fixes:
- Targets the real `.search-filter-row` DOM class for sizing.
- Prevents legacy `renderFilters()` from restoring `Platform · Any ▾`.
- Prevents duplicate textual + CSS chevrons.
- Platform and Model use the same CSS chevron.
- Platform/Model selected values remain only inside their respective buttons.
- Keeps Search + Platform + Model on one row.

Replace:
- model-support.js
- product-ui.css
- sw.js

Add/Delete/SQL: none

Commit:
M1.7.11.6 — Fix Library Filter Rendering Conflict
