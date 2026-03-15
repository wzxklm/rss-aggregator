# Project Architecture

## Overview

RSS Aggregator — a self-hosted, single-user RSS aggregation application with AI-powered translation and summarization. The system exposes functionality through both a CLI tool and an HTTP API, with a React-based web frontend.

**CLI is designed for AI Agents, not humans.** The CLI serves as a machine interface for AI agents to interact with the system programmatically. All CLI output is structured JSON for machine readability. Humans use the web frontend for visual interaction.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | TypeScript | 5.x |
| Runtime | Node.js | 22.x |
| Package Manager | pnpm | 10.x |
| Monorepo | pnpm workspaces + Turborepo | - |
| API Framework | Hono | 4.x |
| Database | SQLite (via better-sqlite3) | - |
| ORM | Drizzle ORM | 0.x |
| RSS Parsing | rss-parser | 3.x |
| CLI Framework | Commander.js | 13.x |
| Scheduled Tasks | node-cron | 3.x |
| Logging | pino | 9.x |
| AI SDK | openai (OpenAI-compatible format) | 4.x |
| Frontend Framework | React | 19.x |
| Build Tool | Vite | 6.x |
| UI Components | shadcn/ui + Tailwind CSS 4 | - |
| State Management | TanStack Query | 5.x |
| Routing | React Router | 7.x |
| HTTP Client | ofetch | 1.x |
| HTML Sanitization | DOMPurify | 3.x |
| Auth | JWT (jose) | 6.x |

## Directory Structure

```
rss-agg/
├── package.json                  # Root package.json (workspace scripts)
├── pnpm-workspace.yaml           # Workspace definition
├── turbo.json                    # Turborepo pipeline config
├── tsconfig.base.json            # Shared TypeScript config
├── .env.example                  # Environment variables template
│
├── packages/
│   └── core/                     # Shared business logic package
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts          # Public API barrel export
│       │   ├── db/
│       │   │   ├── schema.ts     # Drizzle schema definitions
│       │   │   ├── migrate.ts    # Migration runner
│       │   │   └── client.ts     # Database client singleton
│       │   ├── services/
│       │   │   ├── feed.ts       # Feed CRUD + fetch logic
│       │   │   ├── entry.ts      # Entry CRUD
│       │   │   ├── category.ts   # Category management
│       │   │   ├── ai.ts         # AI translation & summarization
│       │   │   └── scheduler.ts  # Cron-based feed refresh
│       │   ├── logger.ts          # Pino logger instance
│       │   ├── types/
│       │   │   └── index.ts      # Shared type definitions
│       │   └── utils/
│       │       └── index.ts      # Shared utilities
│       └── drizzle/
│           └── migrations/       # SQL migration files
│
├── apps/
│   ├── api/                      # Hono HTTP API server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts          # Server entry point
│   │       ├── middleware/
│   │       │   └── auth.ts       # JWT auth middleware
│   │       └── routes/
│   │           ├── help.ts       # GET /api/help (no auth)
│   │           ├── feed.ts       # /api/feeds/*
│   │           ├── entry.ts      # /api/entries/*
│   │           ├── category.ts   # /api/categories/*
│   │           └── ai.ts         # /api/ai/*
│   │
│   ├── cli/                      # Commander.js CLI tool
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts          # CLI entry point
│   │       └── commands/
│   │           ├── feed.ts       # feed add/remove/list
│   │           ├── entry.ts      # entry list/read/search
│   │           ├── ai.ts         # ai summarize/translate
│   │           └── server.ts     # start API server
│   │
│   └── web/                      # React + Vite frontend
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html
│       └── src/
│           ├── main.tsx          # App entry point
│           ├── App.tsx           # Root component + router
│           ├── api/
│           │   └── client.ts     # API client (ofetch wrapper)
│           ├── components/
│           │   ├── ui/           # shadcn/ui components
│           │   └── layout/       # Layout components (sidebar, header)
│           ├── pages/
│           │   ├── Login.tsx     # Password login page
│           │   ├── Feeds.tsx     # Feed list + management
│           │   ├── Entries.tsx   # Entry list view
│           │   ├── Reader.tsx    # Article reader view
│           │   └── Settings.tsx  # Settings page
│           ├── hooks/
│           │   └── queries.ts    # TanStack Query hooks
│           └── lib/
│               └── utils.ts      # Frontend utilities
│
├── docs_for_ai/                  # AI programming documentation
│   ├── project-architecture.md
│   ├── data-and-api-design.md
│   ├── cli-design.md
│   ├── web-ui-design.md
│   └── development-plan.md
│
└── .devcontainer/                # Dev container configuration
    └── Dockerfile
```

## Package Dependency Graph

```
@rss-agg/core        (no internal deps, only external packages)
    ↑
    ├── @rss-agg/api  (depends on core)
    ├── @rss-agg/cli  (depends on core)
    └── @rss-agg/web  (depends on core's types only, calls API via HTTP)
```

- `core` is the single source of truth for business logic and types.
- `api` and `cli` import from `core` directly (in-process calls).
- `web` imports type definitions from `core` for type safety, but all data flows through the HTTP API.

## Coding Conventions

### General

- Use ESM (`"type": "module"`) throughout all packages.
- Use `strict` TypeScript config with `noUncheckedIndexedAccess`.
- Prefer `const` over `let`. Never use `var`.
- Use named exports, no default exports (except for pages in React Router).
- File naming: `kebab-case.ts` for all files.

### Error Handling

- Services return `{ data, error }` result objects instead of throwing.
- API routes use Hono's built-in error handling with proper HTTP status codes.
- CLI commands output `{ "error": "<message>" }` to stdout with exit code 1.
- No automatic retry — errors are surfaced immediately, and the user (or AI agent) decides whether to retry.
- Feed fetch errors are stored in `feeds.errorMessage` for visibility; the cron scheduler continues attempting on the next cycle.

### Logging

Use `pino` for structured JSON logging. The logger is defined in `packages/core/src/logger.ts` and shared by all packages.

**Output targets:**
- stdout (always, for dev and container environments)
- File: `./data/logs/app.log` (rotated, for post-mortem analysis)

**Log levels:**
- `debug` — verbose internal state (DB queries, parsed feed data)
- `info` — normal operations (feed refreshed, server started, API request served)
- `warn` — recoverable issues (feed fetch timeout, network error, invalid feed XML)
- `error` — failures requiring attention (AI API error, database write failure, uncaught exceptions)

**Default level:** `info` in production, `debug` in development (`NODE_ENV`-based).

**Key log points:**

| Module | Level | Example |
|--------|-------|---------|
| RSS fetch | info | `Feed refreshed: "Hacker News" (+5 entries)` |
| RSS fetch | warn | `Feed fetch failed: "Some Blog" - ETIMEDOUT` |
| RSS fetch | error | `Feed parse error: "Bad Feed" - Invalid XML at line 42` |
| AI | info | `AI summarize: entry "abc123" (cached)` |
| AI | info | `AI translate: entry "abc123" → zh (API call, 1.2s)` |
| AI | error | `AI API error: 429 Rate Limited` |
| API | info | `GET /api/entries 200 45ms` |
| API | warn | `POST /api/auth/login 401 (wrong password)` |
| Scheduler | info | `Cron started: refresh all feeds every 30 min` |
| Server | info | `Server started on port 3000` |

### Database

- All database access goes through Drizzle ORM — no raw SQL in application code.
- Schema changes require Drizzle migrations (`drizzle-kit generate`).
- Database file location is configurable via `DATABASE_PATH` env var, default `./data/rss-agg.db`.

### Environment Variables

```
DATABASE_PATH=./data/rss-agg.db    # SQLite database file path
AUTH_PASSWORD=                      # Login password (required)
JWT_SECRET=                         # JWT signing secret (required)
AI_BASE_URL=https://api.openai.com/v1  # OpenAI-compatible API base URL
AI_API_KEY=                            # AI provider API key (required for AI features)
AI_MODEL=gpt-4o-mini                   # AI model name (provider-dependent)
API_PORT=3000                       # API server port
LOG_LEVEL=info                      # Log level (debug/info/warn/error)
CRON_INTERVAL=*/30 * * * *         # RSS fetch interval (default: every 30 min)
```
