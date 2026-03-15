# Scheduler Service — Cron-based periodic feed refresh

## Overview

Wraps `node-cron` to provide a singleton scheduled task that periodically calls `refreshAllFeeds`. Started by the API server on startup.

## Key Behaviors

- **Default Interval**: `*/30 * * * *` (every 30 minutes). Overridden by `CRON_INTERVAL` env var, or the `interval` parameter.
- **Singleton Pattern**: Module-level `task` variable. `startScheduler` stops any existing task before creating a new one.
- **Validation**: Validates cron expression via `cron.validate()` before scheduling. Logs error and returns (no-op) on invalid expression.
- **Fire-and-Forget**: The scheduled callback `await`s `refreshAllFeeds()` but does not handle or propagate errors — they are caught inside `refreshAllFeeds` itself.

## Interface

| Function | Signature | Notes |
|----------|-----------|-------|
| `startScheduler` | `(interval?) -> void` | Start cron; stops previous if running |
| `stopScheduler` | `() -> void` | Stop cron; sets task to null |

### Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `CRON_INTERVAL` | No | `*/30 * * * *` | Cron expression for refresh schedule |

## Internal Details

- **Priority**: `interval` param > `CRON_INTERVAL` env var > default `*/30 * * * *`.
- **Task lifecycle**: `cron.schedule()` returns a `ScheduledTask` stored in module-level `task`. `stopScheduler` calls `task.stop()` and nulls the reference.
- **No startup run**: The scheduler only fires on cron ticks, not immediately on start.

## Dependencies

- Uses: `node-cron`, Logger, Feed Service (`refreshAllFeeds`)
- Used by: API App Init (called during server startup in `apps/api/src/index.ts`)
