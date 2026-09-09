# Prompt Manager — M1.6.5.2

## Changes
- Shared links expose approximately 20% of the prompt as the real teaser.
- The rest is a synthetic blurred representation; anonymous clients never receive the hidden full prompt.
- Logged-out visitors only see sign-in CTAs; Copy/Save are removed.
- Authenticated visitors unlock the full prompt directly.
- Duplicate General / General metadata is normalized to General / Multiplatform.
- What's New updated to V1.6.5.2.
- No schema change required.

Existing shares receive the new ~20% teaser after they are shared again.

## Commit title
M1.6.5.2 — Refine Shared Prompt Teaser UX

## Replace
- ui-refine.js
- sw.js
- README.md
- prompt/index.html
- prompt/share.css
- prompt/share.js
