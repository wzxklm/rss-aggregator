# Main Entry — CLI bootstrap and command registration

## Overview

`apps/cli/src/index.ts` is the CLI entry point (`#!/usr/bin/env node`). It loads user config from `~/.config/rss-agg/.env`, sets `LOG_LEVEL=silent` to suppress Pino logs before any core module import, then dynamically imports Commander.js and all command modules.

## Key Behaviors

- **Config loading**: Reads `~/.config/rss-agg/.env` line-by-line; skips comments (`#`) and blank lines; only sets env vars not already present (`if (!process.env[key])`)
- **Log suppression**: Sets `process.env["LOG_LEVEL"] = "silent"` before dynamic imports so Pino (initialized at import time in core) never writes to stdout
- **Dynamic imports**: All Commander.js and command modules are imported inside `async main()` to ensure env vars are set first
- **Help override**: Disables Commander's default `--help` and `help` command; registers custom `help --json` that outputs structured JSON via `success()`

## Interface

`main()` — async entry; no exports (this is the CLI entry point)

### Commands Registered

| Command | Module |
|---------|--------|
| `feed` (add/remove/list/refresh) | `./commands/feed.js` |
| `entry` (list/read/search/star/mark-read) | `./commands/entry.js` |
| `ai` (summarize/translate) | `./commands/ai.js` |
| `server` (start) | `./commands/server.js` |
| `help` (--json) | Inline in `index.ts` |

### `help --json` Output Structure

```json
{ "data": { "commands": [{ "command": "...", "options": [...], "description": "..." }, ...] } }
```

## Internal Details

The `help` command only produces output when `--json` flag is passed. Without `--json`, it silently does nothing (no default help text).

## Dependencies

- Uses: `commander`, `./commands/feed.js`, `./commands/entry.js`, `./commands/ai.js`, `./commands/server.js`, `./output.js`
- Used by: None (entry point)
