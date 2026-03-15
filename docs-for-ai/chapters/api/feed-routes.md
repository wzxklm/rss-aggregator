# Feed Routes — CRUD and refresh for RSS feeds

## Overview

Exposes endpoints for listing, adding, updating, deleting, and refreshing RSS feeds. All endpoints require auth. Delegates most operations to `feedService` from core, with direct DB access for category association updates.

## Key Behaviors

- **List with category filter + enrichment**: `GET /` accepts optional `categoryId` query param, passed to `feedService.getAllFeeds()`. After fetching, enriches each feed with its `categoryId` by querying the `feed_categories` join table. Returns `(Feed & {categoryId: string | null})[]`
- **Add auto-fetches**: `POST /` calls `feedService.addFeed()` which fetches feed metadata and initial entries
- **Category update bypass**: `PATCH /:id` updates title via `feedService.updateFeed()` but handles `categoryId` directly via DB -- deletes existing `feedCategories` rows then inserts new association if `categoryId` is truthy
- **Refresh single/all**: `POST /:id/refresh` and `POST /refresh-all` trigger immediate feed fetch via service

## Interface

| Endpoint | Method | Auth | Request | Response |
|----------|--------|------|---------|----------|
| `/api/feeds` | GET | Yes | Query: `categoryId?: string` | `(Feed & {categoryId: string \| null})[]` |
| `/api/feeds/:id` | GET | Yes | Param: `id` | `Feed` |
| `/api/feeds` | POST | Yes | Body: `{url: string, categoryId?: string}` | `Feed` (201) |
| `/api/feeds/:id` | PATCH | Yes | Param: `id`; Body: `{title?: string, categoryId?: string}` | `Feed` |
| `/api/feeds/:id` | DELETE | Yes | Param: `id` | `Feed` |
| `/api/feeds/:id/refresh` | POST | Yes | Param: `id` | Refresh result |
| `/api/feeds/refresh-all` | POST | Yes | -- | `{totalAdded: number}` |

## Internal Details

- `GET /` enrichment: queries all `feedCategories` rows, builds a `Map<feedId, categoryId>`, then spreads `categoryId` onto each feed object. Since the update handler enforces one-category-per-feed, the map uses simple `feedId -> categoryId` (last-write-wins if multiple exist)
- Category update in PATCH directly uses `getDb()`, `schema.feedCategories`, and `drizzle-orm` `eq` -- bypasses `feedService`
- Error mapping: service `result.error` -> 400/404/500 depending on endpoint
- `url` is required on POST; missing -> 400

## Dependencies

- Uses: `feedService` (core), `getDb` (core), `schema` (core), `drizzle-orm` `eq`
- Used by: Web frontend, CLI (via HTTP)
