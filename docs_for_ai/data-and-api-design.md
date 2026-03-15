# Data & API Design

## Database Schema (SQLite + Drizzle ORM)

### feeds

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, auto (nanoid) | Unique feed ID |
| title | TEXT | | Feed title |
| url | TEXT | NOT NULL, UNIQUE | RSS feed URL |
| siteUrl | TEXT | | Source website URL |
| description | TEXT | | Feed description |
| imageUrl | TEXT | | Feed icon/logo URL |
| lastFetchedAt | INTEGER (timestamp_ms) | | Last successful fetch time |
| errorMessage | TEXT | | Last fetch error message (null = healthy) |
| createdAt | INTEGER (timestamp_ms) | NOT NULL, DEFAULT now | Creation time |

### categories

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, auto (nanoid) | Unique category ID |
| name | TEXT | NOT NULL, UNIQUE | Category name |
| sortOrder | INTEGER | NOT NULL, DEFAULT 0 | Display sort order |

### feed_categories

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| feedId | TEXT | NOT NULL, FK → feeds.id | Feed reference |
| categoryId | TEXT | NOT NULL, FK → categories.id | Category reference |
| | | PK (feedId, categoryId) | Composite primary key |

### entries

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, auto (nanoid) | Unique entry ID |
| feedId | TEXT | NOT NULL, FK → feeds.id | Parent feed |
| guid | TEXT | NOT NULL | Original entry GUID |
| title | TEXT | | Entry title |
| url | TEXT | | Entry link |
| author | TEXT | | Author name |
| content | TEXT | | Full HTML content |
| description | TEXT | | Summary/excerpt from feed |
| publishedAt | INTEGER (timestamp_ms) | NOT NULL | Publish time |
| readAt | INTEGER (timestamp_ms) | | Read time (null = unread) |
| starred | INTEGER (boolean) | NOT NULL, DEFAULT 0 | Starred/bookmarked |
| createdAt | INTEGER (timestamp_ms) | NOT NULL, DEFAULT now | Insertion time |
| | | UNIQUE (feedId, guid) | Dedup constraint |

### summaries

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, auto (nanoid) | Unique summary ID |
| entryId | TEXT | NOT NULL, FK → entries.id | Entry reference |
| summary | TEXT | NOT NULL | AI-generated summary text |
| language | TEXT | NOT NULL, DEFAULT 'en' | Summary language code |
| createdAt | INTEGER (timestamp_ms) | NOT NULL, DEFAULT now | Creation time |
| | | UNIQUE (entryId, language) | One summary per language per entry |

### translations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, auto (nanoid) | Unique translation ID |
| entryId | TEXT | NOT NULL, FK → entries.id | Entry reference |
| title | TEXT | | Translated title |
| content | TEXT | | Translated content |
| language | TEXT | NOT NULL | Target language code |
| createdAt | INTEGER (timestamp_ms) | NOT NULL, DEFAULT now | Creation time |
| | | UNIQUE (entryId, language) | One translation per language per entry |

### Entity Relationship

```
categories ←──M:N──→ feeds ──1:N──→ entries ──1:N──→ summaries
                (feed_categories)           ──1:N──→ translations
```

---

## API Endpoints (Hono)

Base URL: `http://localhost:3000/api`

All endpoints (except `POST /api/auth/login` and `GET /api/help`) require `Authorization: Bearer <jwt>` header.

### Response Convention

All API responses are JSON. Content fields (e.g., `entry.content`) return **raw HTML** as-is from the RSS feed. No server-side conversion to Markdown or plain text.

Success responses return the data directly (no wrapper). Error responses:

```json
{ "error": "<error message>" }
```

### API Discovery

| Method | Path | Description | Auth | Response |
|--------|------|-------------|------|----------|
| GET | /api/help | List all available endpoints | No | `{ endpoints: EndpointInfo[] }` |

`GET /api/help` returns a structured description of every endpoint, allowing AI agents to discover all available operations without external documentation. Response format:

```json
{
  "endpoints": [
    {
      "method": "POST",
      "path": "/api/auth/login",
      "description": "Login with password",
      "auth": false,
      "body": { "password": "string" }
    },
    {
      "method": "GET",
      "path": "/api/entries",
      "description": "List entries with filters",
      "auth": true,
      "query": {
        "feedId": "string?",
        "starred": "boolean?",
        "unread": "boolean?",
        "search": "string?",
        "limit": "number? (default 50)",
        "offset": "number? (default 0)"
      }
    },
    {
      "method": "GET",
      "path": "/api/entries/:id",
      "description": "Get entry detail with full HTML content, includes summary and translation if available",
      "auth": true,
      "params": { "id": "string" }
    },
    {
      "method": "PATCH",
      "path": "/api/entries/:id",
      "description": "Update entry (mark read, toggle star)",
      "auth": true,
      "params": { "id": "string" },
      "body": { "readAt": "timestamp?", "starred": "boolean?" }
    },
    {
      "method": "POST",
      "path": "/api/entries/mark-all-read",
      "description": "Mark multiple entries as read",
      "auth": true,
      "body": { "feedId": "string?", "before": "timestamp?" }
    },
    {
      "method": "GET",
      "path": "/api/feeds",
      "description": "List all feeds",
      "auth": true,
      "query": { "categoryId": "string?" }
    },
    {
      "method": "GET",
      "path": "/api/feeds/:id",
      "description": "Get feed detail",
      "auth": true,
      "params": { "id": "string" }
    },
    {
      "method": "POST",
      "path": "/api/feeds",
      "description": "Add new feed (auto-fetches metadata)",
      "auth": true,
      "body": { "url": "string", "categoryId": "string?" }
    },
    {
      "method": "PATCH",
      "path": "/api/feeds/:id",
      "description": "Update feed",
      "auth": true,
      "params": { "id": "string" },
      "body": { "title": "string?", "categoryId": "string?" }
    },
    {
      "method": "DELETE",
      "path": "/api/feeds/:id",
      "description": "Delete feed and all its entries",
      "auth": true,
      "params": { "id": "string" }
    },
    {
      "method": "POST",
      "path": "/api/feeds/:id/refresh",
      "description": "Force refresh a feed",
      "auth": true,
      "params": { "id": "string" }
    },
    {
      "method": "POST",
      "path": "/api/feeds/refresh-all",
      "description": "Force refresh all feeds",
      "auth": true
    },
    {
      "method": "GET",
      "path": "/api/categories",
      "description": "List categories with feed counts",
      "auth": true
    },
    {
      "method": "POST",
      "path": "/api/categories",
      "description": "Create category",
      "auth": true,
      "body": { "name": "string" }
    },
    {
      "method": "PATCH",
      "path": "/api/categories/:id",
      "description": "Update category",
      "auth": true,
      "params": { "id": "string" },
      "body": { "name": "string?", "sortOrder": "number?" }
    },
    {
      "method": "DELETE",
      "path": "/api/categories/:id",
      "description": "Delete category",
      "auth": true,
      "params": { "id": "string" }
    },
    {
      "method": "POST",
      "path": "/api/ai/summarize/:entryId",
      "description": "AI summarize an entry (cached)",
      "auth": true,
      "params": { "entryId": "string" },
      "body": { "language": "string? (default 'en')" }
    },
    {
      "method": "POST",
      "path": "/api/ai/translate/:entryId",
      "description": "AI translate an entry (cached)",
      "auth": true,
      "params": { "entryId": "string" },
      "body": { "language": "string" }
    }
  ]
}
```

### Auth

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| POST | /api/auth/login | Login with password | `{ password: string }` | `{ token: string }` |

### Feeds

| Method | Path | Description | Request Body / Params | Response |
|--------|------|-------------|----------------------|----------|
| GET | /api/feeds | List all feeds | Query: `?categoryId=` | `Feed[]` |
| GET | /api/feeds/:id | Get feed detail | | `Feed` |
| POST | /api/feeds | Add new feed | `{ url, categoryId? }` | `Feed` (auto-fetches title/metadata) |
| PATCH | /api/feeds/:id | Update feed | `{ title?, categoryId? }` | `Feed` |
| DELETE | /api/feeds/:id | Delete feed + its entries | | `{ success: true }` |
| POST | /api/feeds/:id/refresh | Force refresh a feed | | `{ entriesAdded: number }` |
| POST | /api/feeds/refresh-all | Force refresh all feeds | | `{ totalAdded: number }` |

### Entries

| Method | Path | Description | Request Body / Params | Response |
|--------|------|-------------|----------------------|----------|
| GET | /api/entries | List entries | Query: `?feedId=&starred=&unread=&search=&limit=50&offset=0` | `{ entries: Entry[], total: number }` |
| GET | /api/entries/:id | Get entry detail | | `Entry` (with summary/translation if exists) |
| PATCH | /api/entries/:id | Update entry | `{ readAt?, starred? }` | `Entry` |
| POST | /api/entries/mark-all-read | Mark entries as read | `{ feedId?, before? }` | `{ updated: number }` |

### Categories

| Method | Path | Description | Request Body / Params | Response |
|--------|------|-------------|----------------------|----------|
| GET | /api/categories | List categories with feed counts | | `(Category & { feedCount: number })[]` |
| POST | /api/categories | Create category | `{ name }` | `Category` |
| PATCH | /api/categories/:id | Update category | `{ name?, sortOrder? }` | `Category` |
| DELETE | /api/categories/:id | Delete category | | `{ success: true }` |

### AI

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| POST | /api/ai/summarize/:entryId | Summarize an entry | `{ language?: string }` | `Summary` |
| POST | /api/ai/translate/:entryId | Translate an entry | `{ language: string }` | `Translation` |

---

## AI Integration Design

### Provider

Use the `openai` npm package with OpenAI-compatible API format. This allows switching between any provider that supports the OpenAI chat completions API:

- OpenAI (default)
- Anthropic (via OpenAI-compatible endpoint)
- Ollama (local models)
- OpenRouter, Together, Groq, etc.

Configuration via environment variables:

```
AI_BASE_URL=https://api.openai.com/v1   # API base URL
AI_API_KEY=sk-...                        # API key
AI_MODEL=gpt-4o-mini                     # Model name
```

### AI Client Setup

```typescript
import OpenAI from "openai"

const ai = new OpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.AI_API_KEY,
})

// All calls use: ai.chat.completions.create({ model: process.env.AI_MODEL, ... })
```

### Summarization

- Input: entry title + content (HTML stripped to plain text, truncated to 8000 chars)
- System prompt:

```
You are a content summarizer. Provide a concise summary (2-4 sentences) of the following article.
Respond in {language}. Focus on key points and takeaways.
Output only the summary text, no prefixes or labels.
```

- Output: plain text summary stored in `summaries` table.

### Translation

- Input: entry title + content (plain text, truncated to 8000 chars)
- System prompt:

```
You are a professional translator. Translate the following content to {targetLanguage}.
Maintain the original meaning, tone, and structure.
Return a JSON object with "title" and "content" fields.
```

- Output: JSON `{ title, content }` stored in `translations` table.

### Cost Control

- Cache all AI results in database — never re-process the same entry + language.
- Model is configurable — use cheaper models (e.g., `gpt-4o-mini`) for cost savings.
- Truncate input to 8000 chars to limit token usage.
