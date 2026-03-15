# Layout — MainLayout, Header, Sidebar

## MainLayout (`apps/web/src/components/layout/MainLayout.tsx`)

### Overview
App shell rendered inside `AuthGuard`. Manages sidebar collapse state and search query, passing search to child pages via `Outlet` context.

### Key Behaviors
- **Structure**: Vertical flex — `Header` on top (h-14) + horizontal flex (`Sidebar` + `Outlet`)
- **Sidebar toggle**: `sidebarCollapsed` state; desktop: sidebar hidden/shown; mobile: overlay with backdrop
- **Mobile overlay**: Fixed overlay (`inset-0 top-14 z-40`) with semi-transparent backdrop; click backdrop closes
- **Search state**: `searchQuery` string, passed to children via `<Outlet context={{ searchQuery }} />`
- **Memoized callback**: `handleSearchChange` wrapped in `useCallback`

### Dependencies
- Uses: `Header`, `Sidebar`
- Used by: `App.tsx` (layout route wrapping all protected pages)

---

## Header (`apps/web/src/components/layout/Header.tsx`)

### Overview
Top navigation bar. Contains sidebar toggle, app title, debounced search input, settings link, and logout button.

### Key Behaviors
- **Debounced search**: Local state tracks input; 300ms debounce before calling `onSearchChange`
- **Debounce implementation**: Closure-based timer inside `useCallback`; clears previous timer on each keystroke
- **Logout**: Calls `clearToken()` then `navigate("/login", { replace: true })`
- **Settings navigation**: Icon button navigates to `/settings`

### Interface
```
Props: searchQuery, onSearchChange(query), onToggleSidebar(), sidebarCollapsed
```

### Dependencies
- Uses: `clearToken()` from `api/client`, Input, Button
- Used by: `MainLayout`

---

## Sidebar (`apps/web/src/components/layout/Sidebar.tsx`)

### Overview
Left navigation panel. Shows "All Entries" and "Starred" nav links, collapsible category groups with feed counts, feed list with error indicators, and dialogs for quick-adding feeds/categories.

### Key Behaviors
- **Active route highlighting**: `location.pathname` comparison sets `bg-sidebar-accent` + `font-medium`
- **Category groups**: `Collapsible` component; click name navigates to `/category/:id`; click chevron toggles expand. Filters feeds by `feed.categoryId` and renders matching `FeedItem`s inside collapsible content. Defaults to expanded when category has feeds, collapsed when empty
- **Uncategorized feeds only**: "Feeds" section filters out feeds that have a `categoryId`, showing only uncategorized feeds — avoids duplication with category groups
- **Feed items**: Navigate to `/feed/:id`; show error tooltip if `feed.errorMessage` present
- **Add Feed dialog**: URL input + category select > `addFeed.mutateAsync()`; dialog closes on success
- **Add Category dialog**: Name input > `createCategory.mutateAsync()`; dialog closes on success
- **Feed count badge**: Shows `category.feedCount` in secondary badge when > 0

### Sub-components
- **`CategoryGroup`**: Collapsible wrapper; filters `feeds` by `categoryId === category.id`; navigates on name click, toggles on chevron; renders child `FeedItem`s
- **`FeedItem`**: Feed nav button with image, title, error tooltip

### Interface
```
Props: className?
```

### Dependencies
- Uses: `useFeeds`, `useCategories`, `useAddFeed`, `useCreateCategory`, ScrollArea, Button, Badge, Collapsible, Dialog, Input, Label, Tooltip
- Used by: `MainLayout`
