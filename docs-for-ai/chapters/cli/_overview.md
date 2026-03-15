# CLI Tool — Commander.js CLI for AI agents, outputting JSON only

## Files

| File | Chapter | Responsibility |
|------|---------|----------------|
| `apps/cli/src/index.ts` | [entry-point.md](entry-point.md) | CLI bootstrap: loads config, suppresses logs, registers commands, custom JSON help |
| `apps/cli/src/commands/feed.ts` | [feed-commands.md](feed-commands.md) | feed add/remove/list/refresh with optional category filtering |
| `apps/cli/src/commands/entry.ts` | [entry-commands.md](entry-commands.md) | entry list/read/search/star/mark-read |
| `apps/cli/src/commands/ai.ts` | [ai-commands.md](ai-commands.md) | ai summarize/translate with language option |
| `apps/cli/src/commands/server.ts` | [server-command.md](server-command.md) | Spawns API server as child process |
| `apps/cli/src/output.ts` | [output.md](output.md) | JSON output (success/fail) and lazy DB initialization |

## Overview

The CLI (`rss-agg`) is designed for AI agent consumption — all output is strict JSON via `success()` / `fail()` helpers. On startup, it loads `~/.config/rss-agg/.env` (only sets unset vars), forces `LOG_LEVEL=silent` before any core import (suppresses Pino), then dynamically imports Commander.js and command modules. Default help is replaced with a structured `help --json` command listing all available commands, options, and descriptions.
