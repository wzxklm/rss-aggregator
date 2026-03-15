# Category Service — Category CRUD with feed count aggregation

## Overview

Manages category records used to organize feeds. Provides standard CRUD and augments the list query with a computed `feedCount` via LEFT JOIN on the `feed_categories` join table.

## Key Behaviors

- **Feed Count Aggregation**: `getAllCategories` returns each category with a `feedCount` field computed by `COUNT(feedCategories.feedId)` via LEFT JOIN + GROUP BY.
- **Sort Order**: Categories sorted by `sortOrder` column (ascending).
- **Cascade Delete**: Deleting a category cascades to `feed_categories` rows (removing feed-category associations) but does NOT delete the feeds themselves.
- **Unique Name**: Category `name` has a UNIQUE constraint; duplicate names return an error.

## Interface

| Function | Signature | Notes |
|----------|-----------|-------|
| `createCategory` | `({name, sortOrder?}) -> Result<Category>` | Insert with optional sortOrder (default 0) |
| `getAllCategories` | `() -> Result<(Category & {feedCount})[]>` | All categories with feed counts, sorted by sortOrder |
| `updateCategory` | `(id, {name?, sortOrder?}) -> Result<Category>` | Partial update |
| `deleteCategory` | `(id) -> Result<{success}>` | Delete by ID; checks `changes === 0` for not-found |

## Internal Details

- **getAllCategories SQL**: `SELECT categories.*, COUNT(feed_categories.feed_id) FROM categories LEFT JOIN feed_categories ON ... GROUP BY categories.id ORDER BY categories.sort_order`
- **Delete detection**: Uses `result.changes === 0` to detect non-existent category (no row deleted).

## Dependencies

- Uses: DB Client (`getDb`), Schema (`categories`, `feedCategories`), Logger, `nanoid`
- Used by: API Category Routes, CLI Feed Commands (for category assignment)
