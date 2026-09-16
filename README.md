# Prompt Manager

Prompt Manager is a personal workspace for discovering, collecting, organizing, filtering, personalizing, and using high-quality AI prompts.

**Current Alpha:** M1.7.12.2

## Product direction

Prompt Manager is being built around a simple long-term pipeline:

**Discover → Extract → Understand → Structure → Rank → Personalize → Save → Improve → Use**

The product is not intended to be just another prompt database. The goal is to become a personalized system for finding the right AI prompt and making it immediately useful.

## Current Alpha

The current PWA includes:

- Home, Explore, and Library.
- Personal prompt Library backed by Supabase with local IndexedDB caching.
- Add and edit prompts.
- Categories.
- Platform and model metadata.
- Platform/model filtering.
- Origin filters for Added, Saved, and Imported prompts.
- Bulk CSV/JSON prompt import.
- Duplicate detection during import.
- Prompt ratings.
- Public prompt sharing.
- Featured/Explore prompt catalog.
- English, Spanish, and Serbian interface support.
- Google OAuth and email magic-link authentication.
- Offline-aware PWA behavior.
- MCP integration for external AI clients.
- Responsive mobile and desktop experiences.

### Library controls

Library currently provides:

- Persistent **Filters expanded/collapsed** UI state.
- Filter controls for origin, category, platform, and model.
- A dedicated **Quick Search** control.
- Quick Search is transient: it opens an independent Library search field, focuses it immediately for typing, filters Library prompts in real time, and clears when dismissed or when leaving the Library/app session.
- Search text and selected filter values are not persisted between app sessions.

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

The application currently uses a lightweight web stack rather than a framework migration. Stable runtime filenames are used; release history belongs in Git rather than versioned asset filenames.

### Backend

Supabase provides authentication, database storage, Row Level Security, Edge Functions, and the MCP endpoint.

User data must remain owner-isolated. Secrets and privileged credentials must never be exposed client-side.

### Search

The current Alpha uses deterministic Library filtering/search. The longer-term search architecture is expected to combine PostgreSQL full-text search, metadata/filters, semantic search with pgvector, quality signals, and personalization.

## Prompt model

A prompt is the atomic unit.

Prompt chains should be represented as independent prompts linked by a chain identifier and order rather than as one monolithic prompt.

Model metadata supports:

- unspecified model
- explicit `multimodel`
- one or more specific models

Platform and model are separate metadata dimensions.

## Ingestion

Prompt Manager should not depend on unrestricted X scraping.

The intended architecture is:

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
Prompt Graph / Catalog
```

X is one possible acquisition adapter, not the architecture itself.

User imports remain private by default. Importing a prompt does not publish it.

## MCP

Prompt Manager exposes an OAuth-protected MCP integration intended to let compatible AI clients work with a user's prompt library.

Current tool surface includes prompt listing, search, retrieval, creation, update, deletion, and rating.

## MVP principles

- Fast, intelligent, personalized, simple.
- Prompt quality matters more than popularity.
- AI should be used where it materially improves extraction, classification, metadata, ranking, personalization, or prompt improvement.
- Deterministic code is preferred when it is cheaper and more reliable.
- Avoid building a full social network, marketplace, payments, or heavy community functionality before validating the core product.
- External content is untrusted and must be treated as a potential prompt-injection/security boundary.
- Avoid platform dependencies that create unacceptable cost, policy, or reliability risk.

## Current validation goal

The Alpha should validate whether users repeatedly discover/save prompts they actually use.

A key behavioral signal is **prompts actually used per week**, rather than simply the number of prompts stored.

## Repository documentation

`README.md` is the canonical living project README.

Release history is maintained through Git commits. Do not add version-specific `README-M*.md` files for future releases.
