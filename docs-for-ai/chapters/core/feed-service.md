# Feed Service — Feed lifecycle management, RSS fetch/parse, entry ingestion

## Overview

Manages the full feed lifecycle: CRUD operations on feed records, fetching and parsing RSS/Atom XML via `rss-parser`, and ingesting parsed entries into the database. Serves as the central coordination point between external RSS sources and the local database.

## Key Behaviors

- **RSS Parsing**: Uses `rss-parser` library. Extracts `content:encoded` (preferring it over `content`), falls back through `guid -> link -> title -> nanoid()` for entry GUIDs.
- **Duplicate Suppression**: Inserts entries one-by-one; catches `UNIQUE constraint` errors on the `(feedId, guid)` index and silently skips duplicates. No pre-check query needed.
- **Feed Metadata Auto-Population**: On first successful fetch (when `feed.title` is null), populates `title`, `siteUrl`, `description`, `imageUrl` from parsed feed data.
- **Error Tracking**: On fetch failure, stores error message in `feed.errorMessage`. On success, clears `errorMessage` to null and updates `lastFetchedAt`.
- **addFeed Workflow**: Fetches and parses URL first to extract metadata, creates the feed record with that metadata, then inserts initial entries. If parsing fails, feed is still created but `errorMessage` is stored.
- **Category Association**: `createFeed` accepts optional `categoryId` and inserts into `feed_categories` join table.
- **Serial Refresh**: `refreshAllFeeds` iterates feeds sequentially (no parallel fetching).

## Interface

| Function | Signature | Notes |
|----------|-----------|-------|
| `createFeed` | `(input) -> Result<Feed>` | Insert feed row + optional category link |
| `getAllFeeds` | `(categoryId?) -> Result<Feed[]>` | All feeds, or filtered by category via join |
| `getFeedById` | `(id) -> Result<Feed>` | Single feed lookup |
| `updateFeed` | `(id, input) -> Result<Feed>` | Partial update of metadata/status fields |
| `deleteFeed` | `(id) -> Result<{success}>` | Delete by ID; cascade deletes entries |
| `fetchAndParseFeed` | `(url) -> Promise<Result<ParsedFeed>>` | Fetch URL, parse RSS/Atom, return structured data |
| `refreshFeed` | `(feedId) -> Promise<Result<{entriesAdded}>>` | Fetch + ingest new entries for one feed |
| `refreshAllFeeds` | `() -> Promise<Result<{totalAdded, results}>>` | Refresh all feeds sequentially |
| `addFeed` | `(input) -> Promise<Result<Feed>>` | Create feed with auto-fetched metadata + initial entries |

### Exported Types

- `ParsedFeed` — `{ title, siteUrl, description, imageUrl, items: ParsedFeedItem[] }`
- `ParsedFeedItem` — `{ guid, title, url, author, content, description, publishedAt }`

## Internal Details

- **rssParser singleton**: Module-level `new RssParser()`, reused across all calls.
- **GUID fallback chain**: `item.guid ?? item.link ?? item.title ?? nanoid()` — ensures every entry gets a GUID even if the feed omits it.
- **Content extraction priority**: `item["content:encoded"] ?? item.content` for full content; `item.contentSnippet ?? item.summary` for description.
- **publishedAt fallback**: Uses `Date.now()` if `item.pubDate` is missing or unparseable.
- **refreshAllFeeds return**: Returns per-feed results array with either `entriesAdded` or `error` for each feed, plus `totalAdded` aggregate.

## Dependencies

- Uses: DB Client (`getDb`), Schema (`feeds`, `feedCategories`, `entries`), Logger, `nanoid`, `rss-parser`
- Used by: API Feed Routes, CLI Feed Commands, Scheduler Service (`refreshAllFeeds`)

## Threading / Concurrency

No concurrency control. `refreshAllFeeds` processes feeds serially with `await` in a for-loop. If the scheduler triggers a refresh while a manual refresh is running, both will execute against SQLite (WAL handles read concurrency; write conflicts resolved by SQLite busy handler).

## Security

None. Feed URLs are fetched without sanitization or allowlist. No SSRF protection.
