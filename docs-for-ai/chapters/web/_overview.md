# Web Frontend — React SPA for RSS reading, feed management, and AI features

## Files

| File | Chapter | Responsibility |
|------|---------|----------------|
| `apps/web/src/App.tsx` | [routing-state.md](routing-state.md) | Router, QueryClient, provider tree |
| `apps/web/src/api/client.ts` | [routing-state.md](routing-state.md) | API client (ofetch), types, token management |
| `apps/web/src/hooks/queries.ts` | [routing-state.md](routing-state.md) | TanStack Query hooks for all API endpoints |
| `apps/web/src/components/AuthGuard.tsx` | [routing-state.md](routing-state.md) | Token-based route protection |
| `apps/web/src/pages/Login.tsx` | [pages.md](pages.md) | Password login form |
| `apps/web/src/pages/Feeds.tsx` | [pages.md](pages.md) | Dual-pane reader, entry list, AI panel |
| `apps/web/src/pages/Settings.tsx` | [pages.md](pages.md) | Feed/category CRUD management |
| `apps/web/src/components/layout/MainLayout.tsx` | [layout.md](layout.md) | Shell: header + sidebar + outlet |
| `apps/web/src/components/layout/Header.tsx` | [layout.md](layout.md) | Top bar: search, settings, logout |
| `apps/web/src/components/layout/Sidebar.tsx` | [layout.md](layout.md) | Navigation: feeds, categories, quick-add dialogs |
| `apps/web/src/components/ui/*.tsx` | [ui-components.md](ui-components.md) | 12 Base UI primitives (shadcn-style) |
| `apps/web/src/lib/utils.ts` | [ui-components.md](ui-components.md) | `cn()` — Tailwind class merge utility |
| `apps/web/src/main.tsx` | [routing-state.md](routing-state.md) | React DOM entry point |

## Overview

Single-page React app using Vite, TanStack Query for server state, react-router for client routing, and Base UI (shadcn) primitives for the component library. All API calls go through an ofetch client with auto Bearer token injection and 401 auto-logout. Content from RSS feeds is rendered as sanitized HTML via DOMPurify, styled with `@tailwindcss/typography` `prose` classes. The app supports AI-powered summarization and translation of entries.
