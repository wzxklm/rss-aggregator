# Pages — Login, Feeds (reader + AI), Settings

## Login Page (`apps/web/src/pages/Login.tsx`)

### Overview
Password-only login form. On success, stores JWT token and navigates to root. No username field — the app uses single-user auth.

### Key Behaviors
- **Form flow**: password input > `api.login(password)` > `setToken(token)` > `navigate("/", { replace: true })`
- **Error handling**: Catches all errors, displays generic "Invalid password"
- **Loading state**: Disables submit button during request

### Dependencies
- Uses: `api.login()`, `setToken()`, Button, Input, Label
- Used by: `App.tsx` (route `/login`)

---

## Feeds Page (`apps/web/src/pages/Feeds.tsx`)

### Overview
Main reading interface. Dual-pane layout: entry list (left, 360px) + reader panel (right, flex). On mobile, toggles between list and reader views. Contains 4 sub-components: `EntryListToolbar`, `EntryListItem`, `ReaderPanel`, `AIPanel`.

### Key Behaviors
- **Route-based filtering**: Reads `params.feedId`, `params.categoryId`, `location.pathname === "/starred"` to build `EntryFilters`
- **Search integration**: Receives `searchQuery` from `MainLayout` via `useOutletContext`
- **Entry list**: Fetches up to 50 entries; shows unread dot, star icon, truncated title, date
- **Mobile responsive**: `mobileView` state toggles between `"list"` and `"reader"` with CSS `hidden`/`flex`

### ReaderPanel Sub-component
- **Auto-mark read**: `setTimeout` 2s after entry loads (if `readAt === null`); cleared on unmount/entry change
- **XSS protection**: Content sanitized via `DOMPurify.sanitize()` before `dangerouslySetInnerHTML`
- **Content fallback**: Uses `entry.content`, falls back to `entry.description`, then "No content available"
- **Star toggle**: Calls `useUpdateEntry` with `starred: !isStarred`
- **External link**: Opens original URL in new tab with `rel="noopener noreferrer"`

### AIPanel Sub-component
- **Position**: Rendered at top of reader panel (after title/metadata/actions, before content separator)
- **Keyed by entry ID**: `key={entry.id}` forces remount on entry switch, resetting mutation state to prevent stale AI results from previous entry leaking into the current view
- **Layout**: Action buttons (Summarize, Translate) on the left, shared language selector on the right — one dropdown controls target language for both operations
- **Summarize**: Calls `useSummarize({ entryId, language: targetLang })` with selected language (default `"zh"`)
- **Translate**: Calls `useTranslate({ entryId, language: targetLang })` with same selected language
- **Language options**: zh, es, fr, de, ja, ko
- **Result display**: Shows existing summaries/translations matching selected language from entry detail, or fresh mutation result. Content rendered as Markdown via `react-markdown` wrapped in `prose` styling for proper formatting (headings, lists, paragraphs)
- **Error toasts**: Mutation errors shown via `toast.error()`

### EntryListToolbar Sub-component
- **Mark all read**: Dropdown menu with "Mark all as read" action, scoped to current `filters.feedId`

### Security Concerns
- See `pitfalls.md` "Web Frontend — Security" for DOMPurify and AI panel sanitization details
- AI summary/translation content rendered as Markdown via `react-markdown` (no raw HTML pass-through), safe from XSS

### Dependencies
- Uses: `useEntries`, `useEntry`, `useUpdateEntry`, `useMarkAllRead`, `useSummarize`, `useTranslate`, `DOMPurify`, `react-markdown`, ScrollArea, Button, Skeleton, Separator, Badge, DropdownMenu
- Used by: `App.tsx` (routes `/`, `/starred`, `/feed/:feedId`, `/category/:categoryId`)

---

## Settings Page (`apps/web/src/pages/Settings.tsx`)

### Overview
CRUD management for feeds and categories. Two Card sections: feed management (add, edit title, delete, refresh all) and category management (create, rename, delete).

### Key Behaviors
- **Add feed**: URL input + optional category select > `useAddFeed.mutateAsync()`; Enter key submits
- **Refresh all**: `useRefreshAllFeeds()`, shows count of new entries on success
- **Feed editing**: Inline title editing via `FeedRow` — click edit icon, Input appears, blur/Enter saves via `useUpdateFeed`
- **Feed deletion**: `window.confirm()` dialog > `useDeleteFeed()`; warns about entry removal
- **Category CRUD**: Same inline-edit pattern as feeds; create via input + button, delete with confirm
- **Back navigation**: Ghost button navigates to `/`

### Sub-components
- **`FeedRow`**: Shows feed image/placeholder, title, URL, error message, edit/delete buttons
- **`CategoryRow`**: Shows category name, edit/delete buttons

### Dependencies
- Uses: `useFeeds`, `useCategories`, `useDeleteFeed`, `useUpdateFeed`, `useDeleteCategory`, `useUpdateCategory`, `useRefreshAllFeeds`, `useAddFeed`, `useCreateCategory`, Card, Button, Input, Label, Separator, Dialog
- Used by: `App.tsx` (route `/settings`)
