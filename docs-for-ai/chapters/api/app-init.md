# App Initialization — Hono app bootstrap and server startup

## Overview

`apps/api/src/index.ts` creates the Hono app, wires middleware (CORS, request logging), registers public and protected routes, optionally serves a static SPA frontend, runs DB migrations, starts the scheduler, and binds the HTTP server.

## Key Behaviors

- **CORS**: Applied to `/api/*`. Allows any origin, methods `GET/POST/PATCH/DELETE/OPTIONS`, headers `Content-Type` + `Authorization`
- **Request logging**: Middleware on `/api/*` measures request duration and logs `{method, path, status, ms}` via `logger.info`
- **Route registration order**: Public routes (`/api/auth`, `/api/help`) registered first; then `requireAuth` middleware applied to `/api/feeds/*`, `/api/entries/*`, `/api/categories/*`, `/api/ai/*`; then protected route handlers
- **Static SPA serving**: Resolves `STATIC_DIR` env var or falls back to `../../web/dist` relative to source. If directory exists, serves static files and falls back to `index.html` for SPA client-side routing
- **Startup sequence**: `runMigrations()` (sync) -> `schedulerService.startScheduler()` -> `serve()` on `API_PORT` (default 3000)

## Interface

Exports: `app` (Hono instance)

## Internal Details

- Static dir resolution uses `import.meta.url` -> `fileURLToPath` -> `path.dirname` to get `__dirname` equivalent in ESM
- `index.html` fallback reads file synchronously with `fs.readFileSync` on every non-static request (no caching)
- Port read from `API_PORT` env var, coerced to `Number`, defaults to `3000`

## Dependencies

- Uses: `hono`, `hono/cors`, `@hono/node-server`, `@hono/node-server/serve-static`, `runMigrations` (core), `logger` (core), `schedulerService` (core), `auth` + `requireAuth` (local middleware), all route modules
- Used by: CLI server command (spawns API as child process)
