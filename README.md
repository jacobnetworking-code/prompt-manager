# Prompt Manager

Prompt Manager is a personal workspace for discovering, collecting, organizing, personalizing, and using high-quality AI prompts.

**Current Alpha:** V2.0

## Product direction

**Discover → Extract → Understand → Structure → Rank → Personalize → Save → Improve → Use**

The goal is not to become another static prompt database. Prompt Manager is being built as a personalized system for finding the right prompt and making it immediately useful.

## Current product

The PWA currently includes:

- Home, Explore, Featured, and Library.
- Personal prompt Library backed by Supabase with local IndexedDB caching.
- Add, save, search, filter, rate, share, import, and use prompts.
- Categories plus canonical platform/model metadata.
- Prompt Chains: first-class Library objects containing ordered prompts.
- Chains can mix prompts written directly in the Chain with snapshots of prompts already saved in the Library.
- English, Spanish, and Serbian interface support.
- Google OAuth and email magic-link authentication.
- Offline-aware PWA behavior.
- MCP integration for compatible external AI clients.
- Responsive mobile and desktop experiences.

## Architecture

```text
Browser / Installed PWA
        ↓
HTML + CSS + JavaScript
        ↓
IndexedDB local cache
        ↓
Supabase source of truth
```

Prompt Manager deliberately remains on a lightweight web stack for the Alpha. Stable runtime filenames are used; Git history is the release history.

### Data model

A standalone prompt remains an atomic Library object.

A Prompt Chain is a separate first-class object stored in `prompt_chains`. Its ordered prompts are stored in `prompt_chain_steps`. A step may reference an existing Library prompt while retaining snapshot content, so deleting the standalone prompt does not destroy the Chain.

Supabase Row Level Security must keep all user-owned data isolated. Secrets and privileged credentials must never be exposed client-side.

### Search

The current Alpha uses deterministic Library search, metadata, and filters. The longer-term direction can combine PostgreSQL full-text search, metadata, semantic search, quality signals, and personalization once the core behavior is validated.

## Ingestion

Prompt Manager must not depend on unrestricted X scraping. X is an acquisition source, not the architecture.

```text
Source
  ↓
Acquisition Adapter
  ↓
Candidate
  ↓
Extraction / Classification
  ↓
Normalization + Deduplication
  ↓
Prompt Catalog
```

User imports remain private by default.

## MCP

Prompt Manager exposes an OAuth-protected MCP integration so compatible AI clients can work with a user's prompt library.

## MVP principles

- Fast, intelligent, personalized, simple.
- Prompt quality matters more than popularity.
- Prefer deterministic code when it is cheaper and more reliable than AI.
- Treat external content as untrusted.
- Avoid unnecessary platform dependencies and premature social/community complexity.
- Protect user data and account isolation before adding growth features.

## Current validation goal

Validate whether users repeatedly discover, save, and actually use prompts. A key behavioral signal is **prompts used per week**, not simply prompts stored.

## Repository documentation

`README.md` is the canonical living project README. Do not create version-specific README files. Release history belongs in Git.
