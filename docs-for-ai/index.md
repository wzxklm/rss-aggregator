# RSS Aggregator Project Index

> Read this first, then relevant chapter(s) per task.

## Overview

Monorepo RSS feed aggregator with core library, REST API, CLI tool, and React SPA frontend — supports AI-powered summarization and translation.

| Key      | Value |
|----------|-------|
| Stack    | TypeScript, Node.js 22, React 19, Hono, Drizzle ORM, SQLite, Vite, TailwindCSS, Turborepo, pnpm |
| Arch     | Monorepo: Core Library → API (Hono) + CLI (Commander) + Web SPA (React) |
| Platform | Node.js 22 (server/CLI), Browser (frontend), Docker |
| Tests    | None configured |
| Build    | `pnpm run build` (Turborepo) |
| Test Cmd | N/A |

## Directory Tree

```
/
├── packages/
│   └── core/src/                    # Shared business logic (@wzxklm/rss-agg-core)
│       ├── db/
│       │   ├── client.ts            # SQLite + Drizzle singleton (WAL mode)
│       │   ├── schema.ts            # Table schemas: feeds, entries, categories, summaries, translations
│       │   └── migrate.ts           # Drizzle migration runner
│       ├── services/
│       │   ├── feed.ts              # Feed CRUD + RSS fetch/parse
│       │   ├── entry.ts             # Entry queries, filtering, read/star
│       │   ├── category.ts          # Category CRUD + feed count
│       │   ├── ai.ts                # OpenAI-compatible summarize/translate with cache
│       │   └── scheduler.ts         # Cron-based periodic feed refresh
│       ├── types/index.ts           # Result<T>, model types (Feed, Entry, Category, Summary, Translation)
│       ├── utils/index.ts           # htmlToText helper
│       ├── logger.ts                # Pino logger (JSON prod, pretty dev)
│       └── index.ts                 # Public exports
├── apps/
│   ├── api/src/                     # REST API server (@rss-agg/api)
│   │   ├── index.ts                 # Hono app: CORS, logging, static serve, startup
│   │   ├── middleware/auth.ts       # JWT auth (login + requireAuth)
│   │   └── routes/
│   │       ├── feed.ts              # /api/feeds CRUD + refresh
│   │       ├── entry.ts             # /api/entries list/detail/update
│   │       ├── category.ts          # /api/categories CRUD
│   │       ├── ai.ts                # /api/ai/summarize + translate
│   │       └── help.ts              # /api/help (public, self-documenting)
│   ├── cli/src/                     # CLI tool (@wzxklm/rss-agg)
│   │   ├── index.ts                 # Commander entry, env config, custom help
│   │   ├── commands/
│   │   │   ├── feed.ts              # feed add/remove/list/refresh
│   │   │   ├── entry.ts             # entry list/read/search/star/mark-read
│   │   │   ├── ai.ts                # ai summarize/translate
│   │   │   └── server.ts            # server start (spawns API)
│   │   └── output.ts               # JSON output + DB init
│   └── web/src/                     # React SPA frontend (@rss-agg/web)
│       ├── App.tsx                  # Router + QueryClient + providers
│       ├── api/client.ts            # API client (ofetch, token mgmt, auto-401 logout)
│       ├── hooks/queries.ts         # TanStack Query hooks (20 hooks)
│       ├── pages/
│       │   ├── Login.tsx            # Password auth form
│       │   ├── Feeds.tsx            # Main reader (list + reader pane + AI panel)
│       │   └── Settings.tsx         # Feed/category management
│       ├── components/
│       │   ├── AuthGuard.tsx        # Token-based route protection
│       │   ├── layout/              # MainLayout, Header, Sidebar
│       │   └── ui/                  # 12 Base UI primitives (button, dialog, etc.)
│       └── lib/utils.ts             # cn() class merge utility
├── Dockerfile                       # Multi-stage: build → prod (API + static web)
└── docker-compose.yml               # App service + rss-data volume
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Clients                        │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐ │
│  │ Web SPA  │  │   CLI    │  │ External APIs │ │
│  │ (React)  │  │(Commander│  │  (AI agents)  │ │
│  └────┬─────┘  └────┬─────┘  └──────┬────────┘ │
└───────┼──────────────┼───────────────┼──────────┘
        │ HTTP/JSON    │ direct call   │ HTTP/JSON
        ▼              ▼               ▼
┌───────────────────────────────────────────┐
│            API Server (Hono)              │
│  ┌──────┐  ┌───────────────────────────┐ │
│  │ Auth │→ │ Routes: feed,entry,cat,ai │ │
│  │(JWT) │  └────────────┬──────────────┘ │
│  └──────┘               │                │
└─────────────────────────┼────────────────┘
                          │ imports
┌─────────────────────────▼────────────────┐
│          Core Library                     │
│  ┌────────────────────────────────────┐  │
│  │ Services: feed, entry, category,   │  │
│  │           ai, scheduler            │  │
│  └──────────────┬─────────────────────┘  │
│                 │                         │
│  ┌──────────────▼─────────────────────┐  │
│  │  Database (SQLite + Drizzle ORM)   │  │
│  │  Tables: feeds, entries, categories│  │
│  │          summaries, translations   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────┐  ┌────────────────────┐  │
│  │   Logger   │  │ OpenAI-compatible  │  │
│  │   (Pino)   │  │   API (external)   │  │
│  └────────────┘  └────────────────────┘  │
└──────────────────────────────────────────┘
```

## Dependency Impact Map

| Component | Affects |
|-----------|---------|
| `db/schema.ts` | All services, all API routes with direct DB access, migration runner |
| `db/client.ts` | All services, API routes (direct queries in feed/entry routes) |
| `services/feed.ts` | API feed routes, CLI feed commands, scheduler, entry data availability |
| `services/entry.ts` | API entry routes, CLI entry commands, Feeds page display |
| `middleware/auth.ts` | All protected API routes (feed, entry, category, AI) |
| `api/client.ts` (web) | All query hooks → all pages and sidebar |
| `hooks/queries.ts` | Feeds page, Settings page, Sidebar |
| `types/index.ts` | All services (Result<T> union), CLI output |

## Chapters

| Chapter | File | When to read |
|---------|------|--------------|
| Core Library | `chapters/core/` | DB schema, services, logging, types, utilities |
| API Server | `chapters/api/` | HTTP routes, auth, CORS, static serving |
| CLI Tool | `chapters/cli/` | CLI commands, JSON output, server spawning |
| Web Frontend | `chapters/web/` | React pages, components, hooks, API client |
| Workflows | `chapters/workflows.md` | Any cross-component task |
