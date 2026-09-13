# Prompt Manager M1.6.6.24

## Commit
`M1.6.6.24 — Secure Offline Session UX & Reconnect Sync`

## Requires
Apply after M1.6.6.23.

## Replace
- `index.html`
- `sw.js`

## Add
- `m1.6.6.24.css`
- `m1.6.6.24.js`

## Delete
None.

## SQL
None.

## Changes
- Discreet persistent status while offline:
  - EN: `Offline · Local library`
  - ES: `Sin internet · Biblioteca local`
  - SR: `Bez interneta · Lokalna biblioteka`
- Brief `Back online · Syncing…` state on reconnect.
- Offline access still depends on the persisted Supabase session restored by the existing auth layer. This release does not bypass the auth gate.
- Google/email sign-in is blocked offline with a clear message.
- Share actions are blocked offline with a clear message.
- On reconnect, the persisted session is revalidated using `auth.getUser()` before cloud sync.
- If Supabase confirms that the session is invalid, local auth is cleared and the login gate is restored.
- Transport/network failure during reconnect does not erase the local session; sync is simply deferred.
- Existing IndexedDB local-first Library and sync queue remain unchanged.

## Security model
Offline mode is device-local access for a previously authenticated user, not an authentication bypass. Cloud operations remain protected by Supabase/RLS and require connectivity. IndexedDB is not encrypted by Prompt Manager; device/OS access control remains the protection for the local cache in this MVP.

## QA
- `node --check m1.6.6.24.js` passed.
- `node --check sw.js` passed.
- New CSS/JS load after existing M1.6.6.22 layer.
- New assets included in service-worker app shell.
- Cache bumped to `pm-m1.6.6.24-v1`.
