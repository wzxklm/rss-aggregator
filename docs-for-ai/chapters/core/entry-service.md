# Entry Service — Entry CRUD, multi-filter queries, pagination, read/star management

## Overview

Provides read and write operations on RSS entries with a flexible multi-filter query system. Supports filtering by feed, category, starred status, unread status, and text search, with pagination. Also handles marking entries as read (individually or in bulk).

## Key Behaviors

- **Multi-Filter Queries**: `listEntries` builds a dynamic WHERE clause from optional filters. All conditions are AND-combined.
- **Category Expansion**: When filtering by `categoryId`, first queries `feedCategories` to get matching `feedId`s, then uses `inArray` on entries. Returns empty result immediately if no feeds belong to the category.
- **Pagination**: Default limit 50, offset 0. Returns both `entries` array and `total` count (separate COUNT query with same WHERE).
- **Sort Order**: Always `publishedAt DESC` (newest first).
- **Search**: LIKE pattern matching on `entries.title` field only (`%search%`).
- **markRead**: Convenience wrapper around `updateEntry` that sets `readAt` to provided timestamp or `Date.now()`.
- **markAllRead**: Bulk update — sets `readAt` on all unread entries, optionally filtered by `feedId` and/or `before` timestamp.

## Interface

| Function | Signature | Notes |
|----------|-----------|-------|
| `createEntry` | `(input) -> Result<Entry>` | Insert entry; input omits `id` and `createdAt` |
| `listEntries` | `(filters?) -> Result<{entries, total}>` | Multi-filter + pagination |
| `getEntryById` | `(id) -> Result<Entry>` | Single entry lookup |
| `updateEntry` | `(id, input) -> Result<Entry>` | Partial update of `readAt`, `starred` |
| `markRead` | `(id, readAt?) -> Result<Entry>` | Set readAt to now or provided timestamp |
| `markAllRead` | `(filters?) -> Result<{updated}>` | Bulk mark-read; optional feedId + before filters |

### Filter Options for `listEntries`

| Filter | Type | Behavior |
|--------|------|----------|
| `feedId` | string | Exact match on `entries.feedId` |
| `categoryId` | string | Expands to feedIds via `feedCategories` subquery |
| `starred` | boolean | `entries.starred = 1` |
| `unread` | boolean | `entries.readAt IS NULL` |
| `search` | string | `entries.title LIKE %search%` |
| `limit` | number | Page size (default 50) |
| `offset` | number | Skip count (default 0) |

## Internal Details

- **Category-to-feeds resolution**: Synchronous query to `feedCategories` before main query. Not a SQL subquery — two separate queries.
- **Count query**: Runs a separate `SELECT count(*)` with the same WHERE clause as the main query, not derived from result set length.
- **starred column**: Integer (0/1) in SQLite; filter checks `eq(entries.starred, 1)`.

## Dependencies

- Uses: DB Client (`getDb`), Schema (`entries`, `feedCategories`), Logger, `nanoid`
- Used by: API Entry Routes, CLI Entry Commands

## Threading / Concurrency

No application-level concurrency control. Relies on SQLite WAL for read isolation. The `markAllRead` bulk update is a single SQL statement (atomic).
