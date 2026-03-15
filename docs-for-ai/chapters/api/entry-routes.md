# Entry Routes — List, detail, update, and bulk-read entries

## Overview

Exposes endpoints for querying feed entries with multi-filter support, fetching entry detail enriched with AI summaries/translations, updating read/star status, and marking entries as read in bulk. All endpoints require auth.

## Key Behaviors

- **Multi-filter list**: `GET /` supports `feedId`, `categoryId`, `starred`, `unread`, `search`, `limit`, `offset` query params. Boolean params compared as `=== "true"`, numeric params coerced with `Number()`
- **Detail enrichment**: `GET /:id` fetches entry via `entryService.getEntryById()`, then does direct DB queries on `schema.summaries` and `schema.translations` tables to include them in response
- **Starred boolean conversion**: `PATCH /:id` accepts `{starred: boolean}` in body but converts to `0/1` integer before passing to `entryService.updateEntry()`
- **Mark-all-read**: `POST /mark-all-read` accepts optional `{feedId, before}` in body. Body parse failure silently defaults to empty object via `.catch()`

## Interface

| Endpoint | Method | Auth | Request | Response |
|----------|--------|------|---------|----------|
| `/api/entries` | GET | Yes | Query: `feedId?`, `categoryId?`, `starred?`, `unread?`, `search?`, `limit?`, `offset?` | `Entry[]` |
| `/api/entries/:id` | GET | Yes | Param: `id` | `Entry & {summaries, translations}` |
| `/api/entries/:id` | PATCH | Yes | Param: `id`; Body: `{readAt?: number, starred?: boolean}` | `Entry` |
| `/api/entries/mark-all-read` | POST | Yes | Body: `{feedId?: string, before?: number}` | Mark result |

## Internal Details

- Detail endpoint uses `getDb()` + `schema.summaries` / `schema.translations` directly -- not through `aiService`
- `readAt` is a Unix timestamp (number), not a Date
- `starred` in request is boolean; converted to `1`/`0` for SQLite storage
- `mark-all-read` body parse uses `.catch(() => ({}))` so missing body doesn't throw

## Dependencies

- Uses: `entryService` (core), `getDb` (core), `schema` (core), `drizzle-orm` `eq`
- Used by: Web frontend, CLI (via HTTP)
