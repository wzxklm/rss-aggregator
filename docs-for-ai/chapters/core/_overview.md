# Core Library — Shared database, services, and utilities for the RSS aggregator

## Files

| File | Chapter | Responsibility |
|------|---------|----------------|
| `packages/core/src/db/client.ts` | [database.md](database.md) | Singleton SQLite connection via Drizzle ORM |
| `packages/core/src/db/schema.ts` | [database.md](database.md) | Drizzle table definitions (feeds, entries, categories, feedCategories, summaries, translations) |
| `packages/core/src/db/migrate.ts` | [database.md](database.md) | Applies Drizzle migrations from /drizzle/migrations |
| `packages/core/src/services/feed.ts` | [feed-service.md](feed-service.md) | Feed CRUD, RSS fetch/parse, entry ingestion |
| `packages/core/src/services/entry.ts` | [entry-service.md](entry-service.md) | Entry CRUD, multi-filter queries, pagination, read/star management |
| `packages/core/src/services/category.ts` | [category-service.md](category-service.md) | Category CRUD with feed count aggregation |
| `packages/core/src/services/ai.ts` | [ai-service.md](ai-service.md) | AI summarization/translation with OpenAI-compatible API and DB caching |
| `packages/core/src/services/scheduler.ts` | [scheduler.md](scheduler.md) | Cron-based periodic feed refresh |
| `packages/core/src/logger.ts` | [infrastructure.md](infrastructure.md) | Pino logger; LOG_LEVEL env var; pretty in dev, JSON in prod |
| `packages/core/src/types/index.ts` | [infrastructure.md](infrastructure.md) | Result<T> discriminated union, Drizzle select/insert types |
| `packages/core/src/utils/index.ts` | [infrastructure.md](infrastructure.md) | htmlToText: strip HTML tags, decode entities, truncate |
| `packages/core/src/index.ts` | [infrastructure.md](infrastructure.md) | Barrel re-export of all services, db, logger, types, utils |

## Overview

The core library (`@wzxklm/rss-agg-core`) is the shared foundation consumed by both the API server (`apps/api`) and CLI tool (`apps/cli`). It owns the SQLite database via Drizzle ORM, exposes service modules for feeds, entries, categories, AI, and scheduling, and provides shared infrastructure (logger, types, utilities). All service functions return `Result<T>` discriminated unions for consistent error handling without exceptions leaking to callers.
