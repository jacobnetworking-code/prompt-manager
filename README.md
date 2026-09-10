# Prompt Manager — M1.6.6.1 Logout Flow Fix

## User-facing fix
Signing out now closes the open profile window immediately. Once Supabase finishes signing out, the existing authentication gate becomes the visible login screen instead of remaining hidden behind the profile dialog.

## What's New
No change. This is a focused bug fix and does not replace the M1.6.6 Desktop Experience entry.

## Commit title
M1.6.6.1 — Fix Logout Flow

## Replace
- ui-refine.js
- sw.js

## Add
- none

## Delete
- none

## SQL
- none
