# Routing & State — Router, providers, API client, query hooks, auth guard

## App (`apps/web/src/App.tsx`)

### Overview
Root component that wires up the provider tree and defines all routes. Renders `Toaster` (sonner) for toast notifications outside the router.

### Key Behaviors
- **Provider nesting**: `QueryClientProvider` > `TooltipProvider` > `BrowserRouter` > `Routes`
- **QueryClient config**: `retry: false`, `refetchOnWindowFocus: false`
- **Route structure**: `/login` is public; all other routes wrapped in `AuthGuard` > `MainLayout`
- **Route table**:

| Path | Component | Filter |
|------|-----------|--------|
| `/login` | `LoginPage` | Public |
| `/` | `FeedsPage` | All entries |
| `/starred` | `FeedsPage` | Starred only |
| `/feed/:feedId` | `FeedsPage` | Single feed |
| `/category/:categoryId` | `FeedsPage` | Category filter |
| `/settings` | `SettingsPage` | Protected |

### Dependencies
- Uses: `AuthGuard`, `MainLayout`, `LoginPage`, `FeedsPage`, `SettingsPage`, `TooltipProvider`
- Used by: `main.tsx`

---

## API Client (`apps/web/src/api/client.ts`)

### Overview
Centralized HTTP client built on `ofetch`. Manages JWT token storage in localStorage, auto-injects Bearer header, and handles 401 auto-logout. Exports 18 typed API functions and all shared TypeScript interfaces.

### Key Behaviors
- **Token storage**: localStorage key `rss-agg-token`; `getToken()`, `setToken()`, `clearToken()` helpers
- **Auto Bearer header**: `onRequest` interceptor reads token, sets `Authorization: Bearer {token}`
- **Auto-logout on 401**: `onResponseError` clears token and redirects to `/login` via `window.location.href`
- **Base URL**: `/api` (reverse-proxied in dev/prod)

### Interface

**Auth**: `login(password) -> {token}`

**Feeds**: `getFeeds(categoryId?)`, `getFeed(id)`, `addFeed(url, categoryId?)`, `updateFeed(id, data)`, `deleteFeed(id)`, `refreshFeed(id)`, `refreshAllFeeds()`

**Entries**: `getEntries(filters)`, `getEntry(id)`, `updateEntry(id, data)`, `markAllRead(feedId?)`

**Categories**: `getCategories()`, `createCategory(name)`, `updateCategory(id, data)`, `deleteCategory(id)`

**AI**: `summarizeEntry(entryId, language?)`, `translateEntry(entryId, language)`

### Types

| Type | Key Fields |
|------|------------|
| `Feed` | id, title, url, siteUrl, imageUrl, lastFetchedAt, errorMessage, categoryId |
| `Category` | id, name, sortOrder, feedCount? |
| `Entry` | id, feedId, title, url, content, description, publishedAt, readAt, starred |
| `EntryDetail` | extends Entry + summaries[], translations[] |
| `Summary` | id, entryId, summary, language |
| `Translation` | id, entryId, title, content, language |
| `EntryFilters` | feedId?, categoryId?, starred?, unread?, search?, limit?, offset? |

### Security Concerns
- See `pitfalls.md` "Web Frontend — Security" for localStorage XSS and client-only auth risks
- **Hard redirect on 401**: Uses `window.location.href` (full page reload), not router navigation

### Dependencies
- Uses: `ofetch`
- Used by: `queries.ts`, `LoginPage`, `AuthGuard`, `Header`

---

## Query Hooks (`apps/web/src/hooks/queries.ts`)

### Overview
TanStack Query hooks wrapping every API function. Provides hierarchical query keys for cache granularity and automatic cache invalidation on mutations.

### Key Behaviors
- **Query keys**: Hierarchical — `["feeds"]`, `["feeds", id]`, `["entries", filters]`, `["entries", "detail", id]`
- **Conditional fetching**: `useFeed(id)` and `useEntry(id)` use `enabled: !!id`
- **Cache invalidation patterns**:
  - Feed mutations invalidate `feeds` + `categories` (feed counts change)
  - `useDeleteFeed` also invalidates `["entries"]` (entries removed)
  - Entry mutations invalidate `["entries"]` + specific `entryDetail`
  - `useMarkAllRead` invalidates `["entries"]` + `feeds`
  - AI mutations (`useSummarize`, `useTranslate`) invalidate the entry detail

### Interface

**Queries** (5): `useFeeds(categoryId?)`, `useFeed(id)`, `useEntries(filters)`, `useEntry(id)`, `useCategories()`

**Mutations** (10): `useAddFeed`, `useUpdateFeed`, `useDeleteFeed`, `useRefreshFeed`, `useRefreshAllFeeds`, `useUpdateEntry`, `useMarkAllRead`, `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory`

**AI Mutations** (2): `useSummarize`, `useTranslate`

### Dependencies
- Uses: `api/client` (all API functions + types)
- Used by: `FeedsPage`, `SettingsPage`, `Sidebar`

---

## AuthGuard (`apps/web/src/components/AuthGuard.tsx`)

### Overview
Route-level guard that checks for token presence in localStorage. Renders child routes via `<Outlet />` if token exists, otherwise redirects to `/login`.

### Key Behaviors
- **Token check only**: Reads `getToken()` — no server-side validation
- **Redirect**: Uses `<Navigate to="/login" replace />` (in-router redirect, no page reload)
- **Renders Outlet**: Wraps all protected routes as a layout route

### Internal Details
- No server validation — see `pitfalls.md` "Web Frontend — Security" for implications
- Synchronous check runs on every render of protected routes

### Dependencies
- Uses: `getToken()` from `api/client`
- Used by: `App.tsx` (wraps all protected routes)
