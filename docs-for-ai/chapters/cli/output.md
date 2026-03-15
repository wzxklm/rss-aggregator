# Output Handler — JSON output and lazy DB initialization

## Overview

Provides the three shared utilities used by every CLI command: `initDb()` for lazy database setup, `success<T>(data)` for successful JSON output, and `fail(msg)` for error JSON output. Both output functions call `process.exit()` — they never return.

## Key Behaviors

- **Lazy DB init**: `initDb()` runs `runMigrations()` from core on first call only; subsequent calls are no-ops (guarded by `dbReady` flag)
- **JSON success**: `success<T>(data)` outputs `{"data": <data>}` to stdout and exits with code 0
- **JSON fail**: `fail(message)` outputs `{"error": "<message>"}` to stdout and exits with code 1
- **Never return**: Both `success` and `fail` have return type `never` — they always call `process.exit()`
- **stdout only**: Both functions write to stdout via `console.log` (not stderr) — consistent JSON output channel for AI agent parsing

## Interface

| Function | Signature | Description |
|----------|-----------|-------------|
| `initDb` | `() → void` | Run migrations once; no-op on subsequent calls |
| `success` | `<T>(data: T) → never` | Output `{"data": ...}` and exit 0 |
| `fail` | `(message: string) → never` | Output `{"error": ...}` and exit 1 |

## Internal Details

`dbReady` module-level boolean flag ensures `runMigrations()` runs exactly once per CLI invocation. This is important because multiple command paths call `initDb()` but migrations should only execute once.

## Dependencies

- Uses: `runMigrations` (from `@wzxklm/rss-agg-core`)
- Used by: Feed Commands, Entry Commands, AI Commands, Server Command (`fail` only)
