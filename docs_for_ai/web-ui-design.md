# Web UI Design

## Layout Overview

The web app uses a classic three-column RSS reader layout:

```
┌──────────────────────────────────────────────────────┐
│  Header (logo, search, settings gear)                │
├────────────┬──────────────┬──────────────────────────┤
│  Sidebar   │  Entry List  │  Reader Panel            │
│            │              │                          │
│  - All     │  - Title     │  - Title                 │
│  - Starred │  - Source    │  - Metadata              │
│  - Categ1  │  - Date      │  - Content               │
│    - Feed1 │  - Snippet   │                          │
│    - Feed2 │              │  - AI Actions            │
│  - Categ2  │              │    [Summarize] [Translate]│
│    - Feed3 │              │                          │
│            │              │                          │
├────────────┴──────────────┴──────────────────────────┤
│  (responsive: sidebar collapses on mobile)           │
└──────────────────────────────────────────────────────┘
```

## Pages & Routes

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/login` | Login | Password input, no layout chrome |
| `/` | Feeds | Main three-column view (redirect to here after login) |
| `/starred` | Feeds | Same layout, filtered to starred entries |
| `/feed/:feedId` | Feeds | Same layout, filtered to specific feed |
| `/category/:categoryId` | Feeds | Same layout, filtered to category |
| `/settings` | Settings | Full-page settings |
| `/settings/feeds` | Settings | Feed management sub-page |

All routes except `/login` are wrapped in an `AuthGuard` that redirects to `/login` if no valid JWT exists.

Note: `/`, `/starred`, `/feed/:feedId`, `/category/:categoryId` all render the same `Feeds` page component with different filter props. This avoids code duplication.

## Component Tree

```
App
├── AuthGuard
│   ├── MainLayout
│   │   ├── Header
│   │   │   ├── Logo
│   │   │   ├── SearchInput
│   │   │   └── SettingsButton
│   │   ├── Sidebar
│   │   │   ├── NavItem ("All", count)
│   │   │   ├── NavItem ("Starred", count)
│   │   │   ├── CategoryGroup (collapsible)
│   │   │   │   └── FeedItem (title, icon, unread count, error warning icon)
│   │   │   ├── AddFeedButton
│   │   │   └── AddCategoryButton
│   │   ├── EntryList
│   │   │   ├── EntryListToolbar (sort, mark all read)
│   │   │   └── EntryListItem[] (title, feed name, date, read state)
│   │   └── ReaderPanel
│   │       ├── ReaderHeader (title, author, date, feed source)
│   │       ├── ReaderContent (HTML sanitized with DOMPurify, then rendered)
│   │       ├── ReaderActions (star, mark read, open original)
│   │       └── AIPanel
│   │           ├── SummarizeButton → SummaryDisplay
│   │           └── TranslateButton → TranslationDisplay
│   └── SettingsPage
│       ├── GeneralSettings (password change, theme)
│       └── FeedManagement (CRUD feeds, OPML import/export)
└── LoginPage
    └── PasswordForm
```

## State Management

### Server State (TanStack Query)

All data from the API is managed by TanStack Query. Key query keys:

```typescript
// Query key conventions
const queryKeys = {
  feeds: ['feeds'] as const,
  feedDetail: (id: string) => ['feeds', id] as const,
  categories: ['categories'] as const,
  entries: (filters: EntryFilters) => ['entries', filters] as const,
  entryDetail: (id: string) => ['entries', 'detail', id] as const,
  summary: (entryId: string, lang: string) => ['summary', entryId, lang] as const,
  translation: (entryId: string, lang: string) => ['translation', entryId, lang] as const,
}
```

Mutations invalidate related queries:
- Add/delete feed → invalidate `feeds`, `categories`, `entries`
- Mark entry read → invalidate `entries` (optimistic update for instant UI)
- Star entry → invalidate `entryDetail` (optimistic update)

### Client State (minimal, React state only)

Only a few pieces of UI state are needed, managed via React `useState` / URL params:

- `selectedEntryId` — which entry is open in the reader (derived from URL or local state)
- `sidebarCollapsed` — sidebar toggle state
- `searchQuery` — current search input

No global state library (Redux/Zustand) is needed. TanStack Query handles all server state, and the remaining client state is simple enough for React's built-in tools.

## UI Components (shadcn/ui)

Pre-built components to use from shadcn/ui:

- `Button`, `Input`, `Label` — forms
- `Card` — entry list items
- `ScrollArea` — sidebar and entry list scrolling
- `Separator` — visual dividers
- `Skeleton` — loading states
- `DropdownMenu` — context menus, sort options
- `Dialog` — add feed, add category modals
- `Collapsible` — category groups in sidebar
- `Badge` — unread count badges
- `Tooltip` — action button hints
- `Toast` (sonner) — success/error notifications

## Responsive Design

| Breakpoint | Layout |
|-----------|--------|
| Desktop (>= 1024px) | Three columns: sidebar (240px) + entry list (360px) + reader (flex) |
| Tablet (768-1023px) | Two columns: sidebar overlays + entry list (360px) + reader (flex) |
| Mobile (< 768px) | Single column: stack navigation (sidebar → list → reader) |

On mobile, navigation is stack-based:
1. Tap sidebar item → shows entry list (sidebar hides)
2. Tap entry → shows reader (list hides)
3. Back button reverses the flow

## Key Interactions

### Adding a Feed
1. User clicks "+" in sidebar → Dialog opens
2. User pastes RSS URL → submits
3. API auto-fetches feed metadata (title, icon, description)
4. Feed appears in sidebar under selected category (or uncategorized)

### Reading an Entry
1. User clicks entry in list → entry loads in reader panel (HTML content is sanitized with DOMPurify before rendering to prevent XSS)
2. Entry is automatically marked as read after 2 seconds
3. User can click [Summarize] → AI summary appears below content
4. User can click [Translate] → translated version replaces content (toggle back)

### Error Handling

All errors are displayed immediately via Toast (sonner) and no automatic retry is performed. The user decides whether to retry.

- **Feed fetch error**: Sidebar shows a warning icon on the affected FeedItem. Hover/click shows `errorMessage`. User can manually click refresh to retry.
- **API request error**: Toast notification with error message (network error, 500, etc.)
- **AI request error**: Toast notification in AIPanel (rate limit, timeout, invalid key, etc.)
- **Add feed error**: Dialog stays open with error message (invalid URL, unreachable, etc.)

### Search
1. User types in header search → debounced API call (300ms)
2. Entry list filters to matching results across all feeds
3. Clear search → return to previous feed/category view
