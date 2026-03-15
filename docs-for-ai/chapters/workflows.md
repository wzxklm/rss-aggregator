# Core Workflows

## 1. User Authentication

```
User navigates to /login
├── Login Page renders password form
│   └── Submit → api.login(password)
│       └── POST /api/auth/login
│           ├── Auth middleware: compare password vs AUTH_PASSWORD env
│           ├── Match → jose.SignJWT({sub:"user"}) with HS256, 7-day expiry
│           │   └── Return { token }
│           └── Mismatch → 401 { error: "Invalid password" }
├── On success:
│   ├── setToken(token) → localStorage["rss-agg-token"]
│   └── navigate("/") → AuthGuard checks token → allow
└── On failure:
    └── Display "Invalid password" error

Subsequent requests:
├── API Client injects Authorization: Bearer <token> via ofetch interceptor
├── requireAuth middleware → jose.jwtVerify(token, JWT_SECRET)
│   ├── Valid → proceed to route handler
│   └── Invalid/expired → 401
└── On 401 response:
    ├── clearToken() → remove from localStorage
    └── redirect to /login
```

## 2. Add Feed

```
User provides feed URL (Settings page, Sidebar dialog, or CLI)
├── Web: POST /api/feeds { url, categoryId? }
│   └── requireAuth → feedRoutes handler
└── CLI: feed add <url> [--category <name>]
    ├── resolveCategoryId(name) → case-insensitive lookup
    └── Direct call: feedService.addFeed({ url, categoryId? })

feedService.addFeed(input):
├── fetchAndParseFeed(url)
│   ├── resolveRssHubUrl(url) → if rsshub:// prefix, replace with RSSHUB_URL base
│   ├── rss-parser.parseURL(resolvedUrl) → extract title, siteUrl, description, imageUrl, items
│   ├── Success → return ParsedFeed
│   └── Failure → return { error } (stored in feed.errorMessage)
├── createFeed → INSERT into feeds table
│   └── If categoryId → INSERT into feedCategories join table
├── Auto-populate: update feed title/siteUrl/description/imageUrl from parsed data
├── For each parsed item:
│   ├── Generate guid (item.guid || item.link || nanoid)
│   ├── INSERT into entries table
│   └── On UNIQUE(feedId, guid) violation → skip silently
└── Return Feed record

Web post-mutation:
└── Invalidate ["feeds"], ["categories"] query caches → refetch
```

## 3. Scheduled Feed Refresh

```
API server startup (index.ts):
├── runMigrations()
├── schedulerService.startScheduler()
│   ├── Read CRON_INTERVAL env (default "*/30 * * * *")
│   ├── Validate cron expression
│   └── node-cron.schedule(interval, callback)
└── serve(app, { port: API_PORT })

On cron fire:
├── feedService.refreshAllFeeds()
│   ├── getAllFeeds() → fetch all feed records
│   └── For each feed:
│       ├── refreshFeed(feedId)
│       │   ├── fetchAndParseFeed(feed.url) → resolves rsshub:// if needed
│       │   │   ├── Success → parse items
│       │   │   └── Failure → set feed.errorMessage, continue
│       │   ├── For each new item:
│       │   │   ├── INSERT entry with generated guid
│       │   │   └── UNIQUE violation → skip (already exists)
│       │   ├── Update feed.lastFetchedAt, clear errorMessage
│       │   └── Return { entriesAdded: count }
│       └── Accumulate results
├── Return { totalAdded, results[] }
└── No error handling or retry (fire-and-forget)

Manual refresh:
├── Web: POST /api/feeds/:id/refresh (single) or POST /api/feeds/refresh-all
└── CLI: feed refresh [id] (single or all)
```

## 4. Browse & Read Entries

```
User navigates to feed view (Web or CLI)
├── Web route determines filters:
│   ├── /feeds → all entries
│   ├── /starred → { starred: true }
│   ├── /feed/:feedId → { feedId }
│   ├── /category/:categoryId → { categoryId }
│   └── Search query from Header → { search }
└── CLI: entry list [--feed id] [--category id] [--unread] [--starred] [--limit N]

GET /api/entries?filters → entryService.listEntries(filters)
├── If categoryId:
│   ├── Query feedCategories → get feedIds for category
│   ├── Empty → return { entries: [], total: 0 }
│   └── Add feedId IN (...) condition
├── Apply filters: feedId, starred, unread (readAt IS NULL), search (title LIKE)
├── Count total matching entries
├── Apply ORDER BY publishedAt DESC, LIMIT, OFFSET
└── Return { entries[], total }

User selects entry:
├── Web: click entry → GET /api/entries/:id
│   ├── Entry record + direct DB query for summaries[] + translations[]
│   ├── Render content via DOMPurify.sanitize() + dangerouslySetInnerHTML
│   └── After 2 seconds → PATCH /api/entries/:id { readAt: now }
└── CLI: entry read <id>
    ├── getEntryById(id)
    ├── Auto-mark read: updateEntry(id, { readAt: now })
    └── Return entry JSON
```

## 5. AI Summarization

```
User requests summary (Web AI Panel or CLI)
├── Web: click Summarize → POST /api/ai/summarize/:entryId { language }
│   └── language comes from shared language selector (default "zh")
└── CLI: ai summarize <entryId> [--lang <code>]

aiService.summarizeEntry(entryId, language = "en"):
├── Check cache: SELECT FROM summaries WHERE entryId AND language
│   └── Hit → return cached Summary
├── Get entry by ID
│   └── Not found → return { error: "Entry not found" }
├── Prepare content: htmlToText(entry.content || entry.description, 8000)
├── Get/create OpenAI client (lazy singleton)
│   └── Config: AI_BASE_URL, AI_API_KEY, AI_MODEL (default "gpt-4o-mini")
├── API call: chat.completions.create({
│   │   model, messages: [system prompt, user content]
│   │ })
│   ├── Success → extract response text
│   ├── 429 → return { error: "Rate limited" }
│   ├── 401 → return { error: "Auth failed" }
│   └── Connection error → return { error: "Connection failed" }
├── INSERT into summaries table (cache)
└── Return Summary record

Web post-mutation:
└── Invalidate ["entries", "detail", entryId] → refetch includes new summary
```

## 6. AI Translation

```
User requests translation (Web AI Panel or CLI)
├── Web: click Translate → POST /api/ai/translate/:entryId { language }
│   └── language from same shared selector as Summarize (default "zh")
└── CLI: ai translate <entryId> [--lang <code>]

aiService.translateEntry(entryId, targetLanguage):
├── Check cache: SELECT FROM translations WHERE entryId AND language
│   └── Hit → return cached Translation
├── Get entry by ID
├── Prepare content: htmlToText(entry.content || entry.description, 8000)
├── API call with prompt requesting JSON { "title", "content" }
│   ├── Success → parse response, strip markdown code fences
│   └── Error handling same as summarize
├── INSERT into translations table (cache)
└── Return Translation { title, content, language }
```

## 7. Category Management

```
Create category:
├── Web: Settings page or Sidebar dialog → POST /api/categories { name }
└── categoryService.createCategory({ name }) → INSERT with nanoid

Assign feed to category:
├── Web: PATCH /api/feeds/:id { categoryId }
│   ├── Route handler: DELETE FROM feedCategories WHERE feedId
│   └── INSERT INTO feedCategories { feedId, categoryId }
│   └── Note: bypasses feedService, direct DB access
└── CLI: feed add <url> --category <name> (on creation only)

Filter by category:
├── GET /api/entries?categoryId=X
│   └── entryService expands category → feedIds → filter entries
└── GET /api/feeds?categoryId=X
    └── feedService filters directly

Sidebar category display:
├── GET /api/feeds → each feed enriched with categoryId from feed_categories table
├── CategoryGroup filters feeds by feed.categoryId === category.id
│   └── Matching feeds rendered as FeedItem children inside Collapsible
└── "Feeds" section only shows feeds where categoryId is null (uncategorized)

Delete category:
├── DELETE /api/categories/:id
└── Cascades: removes feedCategories associations (FK constraint)
    └── Feeds themselves are NOT deleted, only uncategorized
```

## 8. Mark Read / Star

```
Mark single entry read:
├── Web: auto after 2s viewing → PATCH /api/entries/:id { readAt: ISO timestamp }
├── CLI: entry read <id> → auto-marks read
└── entryService.updateEntry(id, { readAt }) → UPDATE entries SET readAt

Mark all read:
├── Web: toolbar button → POST /api/entries/mark-all-read { feedId?, before? }
├── CLI: entry mark-read [--feed id | --all]
└── entryService.markAllRead(filters)
    ├── Build conditions: feedId filter, before timestamp
    └── UPDATE entries SET readAt WHERE readAt IS NULL AND conditions

Toggle star:
├── Web: click star icon → PATCH /api/entries/:id { starred: boolean }
│   └── Route converts boolean → 0|1 for SQLite
└── CLI: entry star <id>
    ├── Read current starred value
    ├── Toggle: starred === 1 ? 0 : 1
    └── updateEntry(id, { starred: toggled })
```
