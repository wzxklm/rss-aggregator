import { ofetch, type FetchOptions } from "ofetch";

const TOKEN_KEY = "rss-agg-token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

const api = ofetch.create({
  baseURL: "/api",
  onRequest({ options }) {
    const token = getToken();
    if (token) {
      const headers = new Headers(options.headers as HeadersInit | undefined);
      headers.set("Authorization", `Bearer ${token}`);
      options.headers = headers;
    }
  },
  onResponseError({ response }) {
    if (response.status === 401) {
      clearToken();
      window.location.href = "/login";
    }
  },
});

// ── Types ───────────────────────────────────────────────────────────────────

export interface Feed {
  id: string;
  title: string | null;
  url: string;
  siteUrl: string | null;
  description: string | null;
  imageUrl: string | null;
  lastFetchedAt: number | null;
  errorMessage: string | null;
  categoryId: string | null;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  feedCount?: number;
}

export interface Entry {
  id: string;
  feedId: string;
  guid: string;
  title: string | null;
  url: string | null;
  author: string | null;
  content: string | null;
  description: string | null;
  publishedAt: number;
  readAt: number | null;
  starred: number;
  createdAt: number;
}

export interface EntryDetail extends Entry {
  summaries: Summary[];
  translations: Translation[];
}

export interface Summary {
  id: string;
  entryId: string;
  summary: string;
  language: string;
  createdAt: number;
}

export interface Translation {
  id: string;
  entryId: string;
  title: string | null;
  content: string | null;
  language: string;
  createdAt: number;
}

export interface EntryFilters {
  feedId?: string;
  categoryId?: string;
  starred?: boolean;
  unread?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function login(password: string): Promise<{ token: string }> {
  return api("/auth/login", { method: "POST", body: { password } });
}

// ── Feeds ───────────────────────────────────────────────────────────────────

export async function getFeeds(categoryId?: string): Promise<Feed[]> {
  const query: FetchOptions["query"] = {};
  if (categoryId) query["categoryId"] = categoryId;
  return api("/feeds", { query });
}

export async function getFeed(id: string): Promise<Feed> {
  return api(`/feeds/${id}`);
}

export async function addFeed(url: string, categoryId?: string): Promise<Feed> {
  return api("/feeds", { method: "POST", body: { url, categoryId } });
}

export async function updateFeed(id: string, data: { title?: string; categoryId?: string }): Promise<Feed> {
  return api(`/feeds/${id}`, { method: "PATCH", body: data });
}

export async function deleteFeed(id: string): Promise<void> {
  return api(`/feeds/${id}`, { method: "DELETE" });
}

export async function refreshFeed(id: string): Promise<{ entriesAdded: number }> {
  return api(`/feeds/${id}/refresh`, { method: "POST" });
}

export async function refreshAllFeeds(): Promise<{ totalAdded: number }> {
  return api("/feeds/refresh-all", { method: "POST" });
}

// ── Entries ─────────────────────────────────────────────────────────────────

export async function getEntries(filters: EntryFilters = {}): Promise<{ entries: Entry[]; total: number }> {
  const query: Record<string, string> = {};
  if (filters.feedId) query["feedId"] = filters.feedId;
  if (filters.categoryId) query["categoryId"] = filters.categoryId;
  if (filters.starred) query["starred"] = "true";
  if (filters.unread) query["unread"] = "true";
  if (filters.search) query["search"] = filters.search;
  if (filters.limit) query["limit"] = String(filters.limit);
  if (filters.offset) query["offset"] = String(filters.offset);
  return api("/entries", { query });
}

export async function getEntry(id: string): Promise<EntryDetail> {
  return api(`/entries/${id}`);
}

export async function updateEntry(id: string, data: { readAt?: number; starred?: boolean }): Promise<Entry> {
  return api(`/entries/${id}`, { method: "PATCH", body: data });
}

export async function markAllRead(feedId?: string): Promise<{ updated: number }> {
  return api("/entries/mark-all-read", { method: "POST", body: { feedId } });
}

// ── Categories ──────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  return api("/categories");
}

export async function createCategory(name: string): Promise<Category> {
  return api("/categories", { method: "POST", body: { name } });
}

export async function updateCategory(id: string, data: { name?: string; sortOrder?: number }): Promise<Category> {
  return api(`/categories/${id}`, { method: "PATCH", body: data });
}

export async function deleteCategory(id: string): Promise<void> {
  return api(`/categories/${id}`, { method: "DELETE" });
}

// ── AI ──────────────────────────────────────────────────────────────────────

export async function summarizeEntry(entryId: string, language = "en"): Promise<Summary> {
  return api(`/ai/summarize/${entryId}`, { method: "POST", body: { language } });
}

export async function translateEntry(entryId: string, language: string): Promise<Translation> {
  return api(`/ai/translate/${entryId}`, { method: "POST", body: { language } });
}
