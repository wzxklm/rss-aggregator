# API Server — Hono REST API for the RSS aggregator

## Files

| File | Chapter | Responsibility |
|------|---------|----------------|
| `apps/api/src/index.ts` | [app-init.md](app-init.md) | App bootstrap: CORS, logging, static SPA, migrations, scheduler, route registration |
| `apps/api/src/middleware/auth.ts` | [auth.md](auth.md) | JWT login endpoint + `requireAuth` middleware |
| `apps/api/src/routes/feed.ts` | [feed-routes.md](feed-routes.md) | CRUD + refresh for RSS feeds |
| `apps/api/src/routes/entry.ts` | [entry-routes.md](entry-routes.md) | List/detail/update entries, mark-all-read |
| `apps/api/src/routes/category.ts` | [category-routes.md](category-routes.md) | CRUD for categories |
| `apps/api/src/routes/ai.ts` | [ai-routes.md](ai-routes.md) | AI summarize + translate endpoints |
| `apps/api/src/routes/help.ts` | [help-route.md](help-route.md) | Public JSON listing of all 18 API endpoints |

## Overview

The API server is a Hono-based REST API served via `@hono/node-server`. On startup it runs DB migrations, starts the feed-refresh cron scheduler, and optionally serves a static SPA frontend. All `/api/*` routes go through CORS and request-logging middleware. Routes under `/api/auth` and `/api/help` are public; all others require a valid JWT Bearer token. Route handlers delegate to core services (`feedService`, `entryService`, `categoryService`, `aiService`) with some direct DB access for join-table operations and entry detail enrichment.
