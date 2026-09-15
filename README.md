# Prompt Manager M1.7.7 — Featured freeze fix

## Replace
- `product-ui.js`
- `sw.js`

## Add
- None

## Delete
- None

## SQL
- None

## Fix
Prevents the legacy Featured View label decorator from writing `textContent` on every MutationObserver callback. That unconditional write generated another child-list mutation and could create a self-triggering loop when Featured cards were rendered, making the app appear frozen.

## QA
- Open Explore → Featured.
- Featured grid renders and remains responsive.
- Tap a Featured card and its View button; prompt detail opens.
- Close detail and open another Featured prompt.
- Save/Share actions remain responsive.
- Explore search/categories and Library still work.
