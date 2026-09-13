# Prompt Manager M1.6.6.22

## Commit
`M1.6.6.22 — Add Editorial Featured Descriptions`

## Replace
- `index.html`
- `sw.js`

## Add
- `m1.6.6.22.js`

## Delete
None.

Keep all M1.6.6.19–M1.6.6.21 assets.

## Change
Featured cards no longer expose a literal excerpt of the underlying prompt. Each of the six curated Featured prompts now has a short editorial description explaining what the prompt achieves.

Descriptions are localized in English, Spanish and Serbian and update with the existing language selector.

Only Featured changes. Normal Explore/category results continue showing prompt excerpts.

No runtime AI call is used: these are deterministic curated metadata, keeping Featured fast, predictable and free of per-view inference cost.

## SQL
None.

## QA
- JavaScript syntax checked.
- Service-worker syntax checked.
- M1.6.6.22 loads after M1.6.6.21.
- New JS included in app-shell cache.
- Six Featured IDs have editorial descriptions in all three supported languages.
