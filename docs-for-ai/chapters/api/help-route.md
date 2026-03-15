# Help Route — Public API endpoint reference

## Overview

Serves a static JSON document listing all 18 API endpoints with their method, path, description, auth requirement, and expected parameters. Public -- no auth required. Intended for AI agent discovery.

## Key Behaviors

- **Static response**: Returns a hardcoded `{endpoints}` array. No DB access, no computation
- **Endpoint schema**: Each entry includes `method`, `path`, `description`, `auth` (boolean), and optional `params`, `query`, `body` objects describing expected fields with type annotations (e.g. `"string?"`, `"number? (default 50)"`)

## Interface

| Endpoint | Method | Auth | Request | Response |
|----------|--------|------|---------|----------|
| `/api/help` | GET | No | -- | `{endpoints: EndpointDoc[]}` |

Documented endpoints (18 total):

| # | Method | Path |
|---|--------|------|
| 1 | POST | `/api/auth/login` |
| 2 | GET | `/api/entries` |
| 3 | GET | `/api/entries/:id` |
| 4 | PATCH | `/api/entries/:id` |
| 5 | POST | `/api/entries/mark-all-read` |
| 6 | GET | `/api/feeds` |
| 7 | GET | `/api/feeds/:id` |
| 8 | POST | `/api/feeds` |
| 9 | PATCH | `/api/feeds/:id` |
| 10 | DELETE | `/api/feeds/:id` |
| 11 | POST | `/api/feeds/:id/refresh` |
| 12 | POST | `/api/feeds/refresh-all` |
| 13 | GET | `/api/categories` |
| 14 | POST | `/api/categories` |
| 15 | PATCH | `/api/categories/:id` |
| 16 | DELETE | `/api/categories/:id` |
| 17 | POST | `/api/ai/summarize/:entryId` |
| 18 | POST | `/api/ai/translate/:entryId` |

## Internal Details

- Endpoint list is a compile-time constant -- must be manually updated when routes change
- No imports from core; only depends on `hono`

## Dependencies

- Uses: `hono`
- Used by: AI agents, CLI discovery, any unauthenticated client
