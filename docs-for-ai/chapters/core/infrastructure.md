# Infrastructure — Logger, types, utilities, public exports

## Logger (`packages/core/src/logger.ts`)

### Overview

Singleton Pino logger instance. Pretty-prints in development, outputs structured JSON in production.

### Key Behaviors

- **Level**: `LOG_LEVEL` env var, or `"debug"` in non-production, `"info"` in production.
- **Transport**: `pino-pretty` with colorize in non-production; no transport (raw JSON) in production.
- **Detection**: Checks `NODE_ENV === "production"` for both level default and transport selection.

### Interface

`logger` — exported Pino instance. Standard methods: `logger.info()`, `logger.error()`, `logger.warn()`, `logger.debug()`.

### Dependencies

- Uses: `pino`, `pino-pretty` (dev transport)
- Used by: All core services, API middleware

---

## Types (`packages/core/src/types/index.ts`)

### Overview

Central type definitions. Drizzle-inferred select and insert model types for all tables, plus the `Result<T>` discriminated union used by every service function.

### Key Types

| Type | Definition |
|------|------------|
| `Result<T>` | `{ data: T; error?: never } \| { data?: never; error: string }` |
| `Feed` | `InferSelectModel<typeof feeds>` |
| `Entry` | `InferSelectModel<typeof entries>` |
| `Category` | `InferSelectModel<typeof categories>` |
| `Summary` | `InferSelectModel<typeof summaries>` |
| `Translation` | `InferSelectModel<typeof translations>` |
| `FeedCategory` | `InferSelectModel<typeof feedCategories>` |
| `New*` variants | `InferInsertModel<typeof ...>` for all tables |

### Result<T> Pattern

All service functions return `Result<T>`. Callers check discriminant:

```typescript
const result = getFeedById(id);
if (result.error) { /* handle error string */ }
else { /* use result.data */ }
```

The `error` and `data` fields are mutually exclusive via `never` types — TypeScript narrows correctly.

---

## Utils (`packages/core/src/utils/index.ts`)

### Overview

Utility functions shared across the core library.

### Interface

`htmlToText(html: string, maxLength?: number) -> string`

### Key Behaviors

- **Tag stripping**: Removes `<script>` and `<style>` blocks, converts block-level closing tags (`</p>`, `</div>`, `<br>`, etc.) to newlines, strips remaining tags.
- **Entity decoding**: Handles `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, `&nbsp;`.
- **Whitespace normalization**: Collapses multiple spaces/tabs to single space, limits consecutive newlines to 2.
- **Truncation**: Default max length 8000 chars. Hard truncate (no word boundary awareness).

### Dependencies

- Uses: none (pure function)
- Used by: AI Service (content preparation before API calls)

---

## Public Exports (`packages/core/src/index.ts`)

Barrel file re-exporting the full public API of `@wzxklm/rss-agg-core`:

| Export | Source | Style |
|--------|--------|-------|
| `getDb`, `AppDatabase` | `db/client.js` | Named |
| `runMigrations` | `db/migrate.js` | Named |
| `schema` | `db/schema.js` | Namespace (`* as schema`) |
| `logger` | `logger.js` | Named |
| `feedService` | `services/feed.js` | Namespace |
| `entryService` | `services/entry.js` | Namespace |
| `categoryService` | `services/category.js` | Namespace |
| `schedulerService` | `services/scheduler.js` | Namespace |
| `aiService` | `services/ai.js` | Namespace |
| `htmlToText` | `utils/index.js` | Named |
| All types | `types/index.js` | Type-only re-export |

Consumers import as: `import { feedService, getDb, type Feed } from "@wzxklm/rss-agg-core"`.
