# Prompt Manager — M1.6.5 Public Prompt Sharing Foundation

## Product behavior
- Library Share now creates/reuses a Prompt Manager permalink instead of sharing raw prompt text.
- Logged-out visitors see title, metadata and a real teaser only.
- The rest is a visual locked state; full prompt content is NOT sent to anonymous clients.
- Google/email sign-in unlocks the complete prompt.
- Signed-in visitors can Copy Prompt or Save to My Library.
- Shared prompt page is a dedicated `/prompt/?s=<slug>` route.
- Full shared content remains protected by Supabase RLS.
- Existing private personal prompts remain private.

## Security model
Public teaser metadata and authenticated full content are stored separately. This avoids a fake CSS-only blur where anonymous users could inspect the network response and recover the full prompt.

## Deployment order
1. Run `m1.6.5-share-schema.sql` in Supabase SQL Editor.
2. Upload the web files to GitHub.
3. Test Share from one personal prompt.
4. Open the resulting link in a private/incognito browser and confirm only teaser is available.
5. Sign in and confirm full prompt + Save to My Library.

## Commit title
M1.6.5 — Public Prompt Sharing Foundation

## Replace
- ui-refine.js
- sw.js
- README.md

## Add
- prompt/index.html
- prompt/share.css
- prompt/share.js
- m1.6.5-share-schema.sql

## Delete
- none
