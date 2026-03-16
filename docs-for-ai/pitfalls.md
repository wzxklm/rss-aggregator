# Pitfalls & Conventions

> Must-read before coding.

---

## Database & Schema

- 🔴 **Schema changes cascade everywhere**: `db/schema.ts` is imported by all services and several API routes with direct DB access — changes require checking all consumers
- **WAL mode**: SQLite runs in WAL journal mode; concurrent readers are fine, but writers serialize at OS level
- **Foreign keys enabled**: `PRAGMA foreign_keys = ON` — deletions cascade through FK constraints (feeds→entries, categories→feedCategories)
- **No transactions on bulk ops**: Feed refresh inserts entries one-by-one; crash mid-batch leaves partial data with lastFetchedAt already updated

## Feed Service

- **Silent duplicate skipping**: UNIQUE(feedId, guid) violations are caught and silently ignored during refresh — no logging, masks potential guid generation issues
- **Serial refresh**: `refreshAllFeeds()` iterates feeds sequentially; slow with many feeds, no parallelism
- **Error tracking**: Feed errors stored in `feed.errorMessage` field; cleared on next successful refresh; no historical error log
- **rsshub:// requires RSSHUB_URL**: `resolveRssHubUrl()` throws if `RSSHUB_URL` env var is not set when processing `rsshub://` URLs; database stores the original `rsshub://` URL, resolution happens at fetch time

## Entry Service

- **Category expansion**: categoryId filter converts to feedIds via subquery; empty category returns empty result (not "not found" error)
- **Pagination default**: limit defaults to 50, no "load more" in web UI — entries beyond 50 require manual offset

## AI Service

- 🔴 **API key in env**: `AI_API_KEY` stored as environment variable — if process.env is logged or dumped, credentials leak
- **Raw HTML to AI**: Entry HTML is sent directly to AI without stripping or truncation; very long articles may increase token usage and cost
- **Cache-first**: Summaries/translations cached in DB by (entryId, language); no cache invalidation if entry content changes
- **Language name mapping**: Prompts use `langName(code)` to convert ISO codes to full names (e.g. `"zh"` → `"Simplified Chinese"`); adding a new language option in the web UI requires a corresponding entry in the `LANGUAGE_NAMES` map in `services/ai.ts`
- **Default model**: Falls back to `gpt-4o-mini` if `AI_MODEL` not set
- **Fire-and-forget errors**: No retry on API failures; user sees error once with no automatic retry

## Scheduler

- 🔴 **No failure notification**: `refreshAllFeeds()` called async with no error handling; feed refresh failures accumulate silently
- **Singleton cron**: Starting a new scheduler stops the previous one; no concurrent scheduling protection beyond this

## API Server — Authentication

- 🔴 **Plaintext password**: `AUTH_PASSWORD` compared as plain string — no hashing, no rate limiting on login attempts
- **JWT secret re-encoded per request**: `getJwtSecret()` calls `TextEncoder.encode(JWT_SECRET)` on every request instead of caching — functionally safe but wasteful
- **7-day token expiry**: JWTs last 7 days with no refresh mechanism; compromised token valid for full duration

## API Server — Routes

- **Direct DB in routes**: Feed PATCH and Entry GET detail bypass services for category updates and summary/translation enrichment — dual path to DB state
- **Feed list enrichment**: `GET /api/feeds` enriches each feed with `categoryId` by querying `feedCategories` join table at the route level (not in core service); the core `Feed` type does NOT include `categoryId` — only the API response does
- **Starred type conversion**: `PATCH /api/entries/:id` converts `starred: boolean` to `0|1` integer for SQLite; adding boolean columns elsewhere must follow same pattern
- **No request size limits**: No body size limits configured in Hono; large payloads could bloat memory
- **Help route is static**: `GET /api/help` returns compile-time constant; must be manually updated when endpoints change

## CLI Tool

- **Log suppression**: Sets `LOG_LEVEL=silent` before importing core; Pino output never reaches CLI stdout (JSON-only convention)
- **Config path**: Loads `~/.config/rss-agg/.env`; respects existing env vars (won't override)
- **Server build check**: `server start` hardcodes relative path `../../../api/dist/index.js`; breaks if monorepo structure changes
- **Star toggle brittle**: Compares `starred === 1 ? 0 : 1`; assumes integer storage, breaks if schema changes to boolean

## Web Frontend — Security

- 🔴 **localStorage token storage**: JWT stored in localStorage; any XSS vulnerability can exfiltrate the token (no HttpOnly protection possible in SPA)
- 🔴 **Client-only auth check**: AuthGuard only checks token existence in localStorage; no server-side validation until first API call — stale/revoked tokens pass initial guard
- **DOMPurify on content**: Entry HTML sanitized via `DOMPurify.sanitize()` before `dangerouslySetInnerHTML` in reader panel
- **AI panel uses react-markdown**: Summary/translation content rendered via `react-markdown` (no raw HTML), safe from XSS

## Web Frontend — Styling

- 🔴 **`@tailwindcss/typography` required for prose**: Entry HTML content and AI results rely on `prose` classes for formatting (headings, links, bold, lists). The plugin is loaded via `@plugin "@tailwindcss/typography"` in `index.css` (Tailwind v4 syntax) — removing it silently strips all article formatting to plain text
- **Tailwind v4 plugin syntax**: Plugins use `@plugin "pkg"` in CSS, NOT `@import` or JS config — wrong syntax causes build failure

## Web Frontend — UX

- **No pagination UI**: Entry list hardcoded to 50 entries; no "next page" or infinite scroll
- **Search scope**: Search filters server-side within current filter context, not global full-text
- **Auto-mark read timer**: 2-second `setTimeout` marks entry as read; no way to disable or configure
- **Debounced search**: 300ms debounce on Header search input before updating filter state

## Architecture Conventions

- **Result<T> pattern**: All core services return `{ data: T } | { error: string }` — callers must check for `error` field before accessing `data`
- **All CLI output is JSON**: CLI is designed for AI agent consumption; human-readable output is not supported
- **API content is raw HTML**: API returns HTML in content fields; frontend is responsible for sanitization
- **OpenAI-compatible format**: AI service uses `openai` npm package with configurable base URL — not Anthropic SDK
- **Monorepo imports**: Apps import core via `@wzxklm/rss-agg-core` package name, not relative paths
