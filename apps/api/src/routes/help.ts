import { Hono } from "hono";

const helpRoute = new Hono();

const endpoints = [
  {
    method: "POST",
    path: "/api/auth/login",
    description: "Login with password",
    auth: false,
    body: { password: "string" },
  },
  {
    method: "GET",
    path: "/api/entries",
    description: "List entries with filters",
    auth: true,
    query: {
      feedId: "string?",
      categoryId: "string?",
      starred: "boolean?",
      unread: "boolean?",
      search: "string?",
      limit: "number? (default 50)",
      offset: "number? (default 0)",
    },
  },
  {
    method: "GET",
    path: "/api/entries/:id",
    description: "Get entry detail with full HTML content, includes summary and translation if available",
    auth: true,
    params: { id: "string" },
  },
  {
    method: "PATCH",
    path: "/api/entries/:id",
    description: "Update entry (mark read, toggle star)",
    auth: true,
    params: { id: "string" },
    body: { readAt: "timestamp?", starred: "boolean?" },
  },
  {
    method: "POST",
    path: "/api/entries/mark-all-read",
    description: "Mark multiple entries as read",
    auth: true,
    body: { feedId: "string?", before: "timestamp?" },
  },
  {
    method: "GET",
    path: "/api/feeds",
    description: "List all feeds, each enriched with categoryId from feed_categories join table",
    auth: true,
    query: { categoryId: "string? (filter by category)" },
    response: { categoryId: "string | null (associated category, added to each Feed object)" },
  },
  {
    method: "GET",
    path: "/api/feeds/:id",
    description: "Get feed detail",
    auth: true,
    params: { id: "string" },
  },
  {
    method: "POST",
    path: "/api/feeds",
    description: "Add new feed (auto-fetches metadata)",
    auth: true,
    body: { url: "string", categoryId: "string?" },
  },
  {
    method: "PATCH",
    path: "/api/feeds/:id",
    description: "Update feed",
    auth: true,
    params: { id: "string" },
    body: { title: "string?", categoryId: "string?" },
  },
  {
    method: "DELETE",
    path: "/api/feeds/:id",
    description: "Delete feed and all its entries",
    auth: true,
    params: { id: "string" },
  },
  {
    method: "POST",
    path: "/api/feeds/:id/refresh",
    description: "Force refresh a feed",
    auth: true,
    params: { id: "string" },
  },
  {
    method: "POST",
    path: "/api/feeds/refresh-all",
    description: "Force refresh all feeds",
    auth: true,
  },
  {
    method: "GET",
    path: "/api/categories",
    description: "List categories with feed counts",
    auth: true,
  },
  {
    method: "POST",
    path: "/api/categories",
    description: "Create category",
    auth: true,
    body: { name: "string" },
  },
  {
    method: "PATCH",
    path: "/api/categories/:id",
    description: "Update category",
    auth: true,
    params: { id: "string" },
    body: { name: "string?", sortOrder: "number?" },
  },
  {
    method: "DELETE",
    path: "/api/categories/:id",
    description: "Delete category",
    auth: true,
    params: { id: "string" },
  },
  {
    method: "POST",
    path: "/api/ai/summarize/:entryId",
    description: "AI summarize an entry (cached)",
    auth: true,
    params: { entryId: "string" },
    body: { language: "string? (default 'en')" },
  },
  {
    method: "POST",
    path: "/api/ai/translate/:entryId",
    description: "AI translate an entry (cached)",
    auth: true,
    params: { entryId: "string" },
    body: { language: "string" },
  },
];

// GET /api/help
helpRoute.get("/", (c) => {
  return c.json({ endpoints });
});

export { helpRoute };
