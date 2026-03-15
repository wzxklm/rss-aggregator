# Entry Commands — entry list/read/search/star/mark-read

## Overview

Registers the `entry` command group with five subcommands for reading, filtering, searching, and managing RSS entries. Designed for AI agent workflows — `entry read` auto-marks entries as read, `star` toggles between 0 and 1.

## Key Behaviors

- **Auto-mark read**: `entry read <id>` fetches the entry, then if `readAt` is null, calls `entryService.markRead(id)` and returns the updated entry
- **Star toggle**: `entry star <id>` reads current `starred` value (0 or 1), flips it via `entryService.updateEntry(id, { starred: newStarred })`
- **mark-read guard**: `entry mark-read` requires either `--feed <id>` or `--all`; fails with error message if neither provided
- **Default limit**: `entry list` defaults `--limit` to `"50"` (parsed to int)
- **Search delegation**: `entry search <keyword>` delegates to `entryService.listEntries({ search: keyword })`

## Interface

`registerEntryCommands(program: Command) → void`

### Commands

| Command | Args | Options | Description |
|---------|------|---------|-------------|
| `entry list` | — | `--feed <id>`, `--category <id>`, `--unread`, `--starred`, `--limit <n>` (default 50) | List entries with filters |
| `entry read` | `<id>` (required) | — | Get full entry content (HTML); auto-marks as read |
| `entry search` | `<keyword>` (required) | — | Full-text search entries |
| `entry star` | `<id>` (required) | — | Toggle starred status (0/1) |
| `entry mark-read` | — | `--feed <id>`, `--all` | Mark entries as read; one of the two options required |

## Internal Details

`entry list` passes options to `entryService.listEntries()` mapping CLI flags: `--feed` to `feedId`, `--category` to `categoryId`, `--unread` and `--starred` as booleans, `--limit` parsed via `parseInt`.

`entry mark-read --all` still calls `entryService.markAllRead({})` with no `feedId` — the `--all` flag only bypasses the guard check; the service handles "mark all" when `feedId` is undefined.

## Dependencies

- Uses: `entryService` (from `@wzxklm/rss-agg-core`), `initDb`, `success`, `fail` (from `../output.js`)
- Used by: Main Entry (`index.ts`)
