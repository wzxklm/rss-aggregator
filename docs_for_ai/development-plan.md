# Development Plan

## Phase 0: Project Scaffolding

Set up the monorepo structure and development environment.

### Tasks

1. Initialize root `package.json` with pnpm workspaces
2. Create `pnpm-workspace.yaml` defining `packages/*` and `apps/*`
3. Create `turbo.json` with build/dev/typecheck pipelines
4. Create shared `tsconfig.base.json` (strict, ESM, path aliases)
5. Create `.env.example` with all required environment variables
6. Create `.gitignore` (node_modules, dist, .env, *.db)
7. Scaffold `packages/core/` with package.json + tsconfig
8. Scaffold `apps/api/` with package.json + tsconfig
9. Scaffold `apps/cli/` with package.json + tsconfig
10. Scaffold `apps/web/` with Vite + React + TypeScript template
11. Verify `pnpm install` and `pnpm run build` work across all packages

### Verification
- `pnpm install` succeeds with no errors
- `pnpm run build` completes for all packages
- Each package can import from `@rss-agg/core`

---

## Phase 1: Core Package — Database & Models

Build the foundation: database schema, client, and basic CRUD services.

### Tasks

1. Install dependencies: `drizzle-orm`, `better-sqlite3`, `nanoid`, `pino`, `pino-pretty`
2. Create `packages/core/src/logger.ts`: pino instance with stdout + file transport
3. Define Drizzle schema in `packages/core/src/db/schema.ts` (all 6 tables)
4. Create database client singleton in `packages/core/src/db/client.ts`
5. Create migration runner in `packages/core/src/db/migrate.ts`
6. Generate initial migration with `drizzle-kit generate`
7. Implement `services/feed.ts`: create, getAll, getById, update, delete
8. Implement `services/entry.ts`: create, list (with filters), getById, update, markRead
9. Implement `services/category.ts`: create, getAll, update, delete
10. Export all public APIs from `packages/core/src/index.ts`
11. Write type definitions in `packages/core/src/types/index.ts`

### Verification
- Run a simple test script that creates a feed, adds entries, queries them
- Database file is created at configured path
- Migrations run cleanly on fresh database

---

## Phase 2: Core Package — RSS Fetching

Implement RSS feed fetching, parsing, and scheduled refresh.

### Tasks

1. Install `rss-parser`
2. Implement `services/feed.ts` additions:
   - `fetchAndParseFeed(url)`: fetch RSS XML, parse to structured data
   - `refreshFeed(feedId)`: fetch feed, insert new entries (deduplicate by guid)
   - `refreshAllFeeds()`: refresh all feeds, collect results
3. Implement `services/scheduler.ts`:
   - Use `node-cron` to run `refreshAllFeeds()` on configured interval
   - Expose `startScheduler()` and `stopScheduler()` functions
4. Handle feed fetch errors gracefully: update `errorMessage` field, continue with other feeds
5. Auto-extract feed metadata (title, siteUrl, description) on first add

### Verification
- Add a real RSS feed URL (e.g., Hacker News), verify entries are parsed and stored
- Run refresh twice, verify no duplicate entries
- Verify error handling with an invalid URL

---

## Phase 3: API Server

Expose core functionality over HTTP with Hono.

### Tasks

1. Install `hono`, `jose` (for JWT)
2. Create server entry point `apps/api/src/index.ts` with Hono app
3. Implement auth middleware `apps/api/src/middleware/auth.ts`:
   - `POST /api/auth/login`: validate password from env, return JWT
   - Middleware: verify JWT on all other routes, return 401 if invalid
4. Implement `routes/feed.ts`: all feed CRUD + refresh endpoints
5. Implement `routes/entry.ts`: list, detail, update, mark-all-read endpoints
6. Implement `routes/category.ts`: all category CRUD endpoints
7. Implement `GET /api/help`: return structured JSON describing all endpoints (no auth required)
8. Add CORS middleware (allow web dev server origin)
9. Add request logging middleware
10. Start the cron scheduler when the server starts

### Verification
- Start server, login via curl, get JWT
- Use JWT to CRUD feeds and entries via curl
- Verify 401 without token
- Verify CORS headers are present

---

## Phase 4: AI Features

Add AI-powered summarization and translation using OpenAI-compatible API.

### Tasks

1. Install `openai` (OpenAI-compatible SDK)
2. Implement `services/ai.ts` in core:
   - `summarizeEntry(entryId, language)`: strip HTML, call AI API, store result
   - `translateEntry(entryId, targetLanguage)`: strip HTML, call AI API, store result
   - Check cache (summaries/translations table) before calling API
3. Add HTML-to-text utility in `packages/core/src/utils/index.ts`
4. Implement `routes/ai.ts` in API server:
   - `POST /api/ai/summarize/:entryId`
   - `POST /api/ai/translate/:entryId`
5. Handle API errors: rate limits, invalid key, timeout

### Verification
- Summarize an entry via API, verify summary is stored and returned
- Translate an entry, verify translation is stored and returned
- Call again, verify cached result is returned (no duplicate API call)

---

## Phase 5: CLI Tool

Build the CLI as an AI Agent interface. All output is JSON for machine readability.

### Tasks

1. Install `commander`
2. Create CLI entry point with Commander program setup
3. Create JSON output helper: wrap all results in `{ data }` or `{ error }`, exit code 0/1
4. Implement `help --json`: output structured JSON listing all commands, options, and descriptions
5. Implement `commands/feed.ts`: add, remove, list, refresh
6. Implement `commands/entry.ts`: list, read (return full JSON with HTML content), search, star, mark-read
7. Implement `commands/ai.ts`: summarize, translate
8. Implement `commands/server.ts`: start (launches API server with scheduler)
9. Add `"bin"` field to `apps/cli/package.json` for global install

### Verification
- `rss-agg feed add <url>` adds a feed and fetches entries
- `rss-agg entry list --unread` shows unread entries
- `rss-agg server start` launches the API and scheduler

---

## Phase 6: Web Frontend

Build the React web interface.

### Tasks

1. Install dependencies: `@tanstack/react-query`, `react-router`, `ofetch`, `tailwindcss`, `sonner`
2. Set up shadcn/ui: init + add required components
3. Create API client (`src/api/client.ts`): ofetch wrapper with JWT auth header
4. Create TanStack Query hooks (`src/hooks/queries.ts`)
5. Build `LoginPage`: password form, store JWT in localStorage
6. Build `MainLayout`: header + sidebar + entry list + reader panel (responsive)
7. Build `Sidebar`: nav items, category groups with feed items, unread counts
8. Build `EntryList`: entry cards with title/feed/date, click to select
9. Build `ReaderPanel`: article content rendering, metadata display
10. Build `AIPanel`: summarize/translate buttons with result display
11. Build `SettingsPage`: feed management (add/edit/delete), category management
12. Add search functionality: debounced search input in header
13. Add responsive breakpoints and mobile navigation
14. Wire up `AuthGuard` route protection

### Verification
- Login with password, verify JWT flow
- Add feeds, browse entries, read articles
- Summarize and translate entries via AI buttons
- Test responsive layout at different breakpoints
- Verify all CRUD operations work end-to-end
