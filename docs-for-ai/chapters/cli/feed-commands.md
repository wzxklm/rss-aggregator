# Feed Commands — feed add/remove/list/refresh with category support

## Overview

Registers the `feed` command group with four subcommands for managing RSS feeds. Supports optional category filtering via case-insensitive name-to-ID resolution using `categoryService`.

## Key Behaviors

- **Category resolution**: `resolveCategoryId(name)` does case-insensitive lookup via `categoryService.getAllCategories()`; returns `undefined` if not found, which triggers `fail()` in callers
- **Add with category**: `feed add <url> --category <name>` resolves category name to ID before calling `feedService.addFeed({ url, categoryId })`
- **List with category filter**: `feed list --category <name>` resolves name then passes `categoryId` to `feedService.getAllFeeds()`
- **Refresh single or all**: `feed refresh [id]` — with ID refreshes one feed; without ID refreshes all feeds

## Interface

`registerFeedCommands(program: Command) → void`

### Commands

| Command | Args | Options | Description |
|---------|------|---------|-------------|
| `feed add` | `<url>` (required) | `--category <name>` | Add feed, optionally assign to category |
| `feed remove` | `<id>` (required) | — | Delete a feed |
| `feed list` | — | `--category <name>` | List all feeds, optionally filtered by category |
| `feed refresh` | `[id]` (optional) | — | Refresh one feed by ID, or all feeds if omitted |

## Internal Details

`resolveCategoryId(name: string): string | undefined` — private helper; fetches all categories, finds case-insensitive match on `name`, returns `match?.id`. Called by `add` and `list` actions.

Both `add` and `refresh` are `async` (feed fetching is async); `remove` and `list` are synchronous.

## Dependencies

- Uses: `feedService`, `categoryService` (from `@wzxklm/rss-agg-core`), `initDb`, `success`, `fail` (from `../output.js`)
- Used by: Main Entry (`index.ts`)
