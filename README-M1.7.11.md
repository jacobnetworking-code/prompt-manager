# Prompt Manager M1.7.11 — Multi-Model Metadata & Filters

Replace: index.html, product-ui.js, product-ui.css, sw.js
Add: model-support.js, m1.7.11-model-support.sql
Delete: none.

IMPORTANT ORDER
1. Export a Prompt Manager backup from Settings > Backup & Restore.
2. Run m1.7.11-model-support.sql in Supabase.
3. Replace/add the runtime files and deploy.

Migration: additive `public.prompts.models text[] NOT NULL DEFAULT '{}'`.

Semantics:
- [] = model unspecified
- ["multimodel"] = intentionally model-agnostic
- one or more names = specific models

Behavior:
- Search + Platform + Model stay on one Library row.
- Initial buttons read Platform and Model; selections replace the labels.
- Multiple models supported; Multimodel is exclusive.
- Model metadata works in manual add/edit, cards, Use Prompt, filtering, CSV/JSON import,
  and catalog saves when source metadata exists.
- Existing prompts remain unspecified rather than being falsely labeled Multimodel.
- Cache: pm-m1.7.11-v1
