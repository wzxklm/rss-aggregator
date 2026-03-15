import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/api/client";
import type { EntryFilters } from "@/api/client";

// ── Query keys ──────────────────────────────────────────────────────────────

export const queryKeys = {
  feeds: ["feeds"] as const,
  feedDetail: (id: string) => ["feeds", id] as const,
  categories: ["categories"] as const,
  entries: (filters: EntryFilters) => ["entries", filters] as const,
  entryDetail: (id: string) => ["entries", "detail", id] as const,
  summary: (entryId: string, lang: string) => ["summary", entryId, lang] as const,
  translation: (entryId: string, lang: string) => ["translation", entryId, lang] as const,
};

// ── Feed queries ────────────────────────────────────────────────────────────

export function useFeeds(categoryId?: string) {
  return useQuery({
    queryKey: categoryId ? [...queryKeys.feeds, categoryId] : queryKeys.feeds,
    queryFn: () => api.getFeeds(categoryId),
  });
}

export function useFeed(id: string) {
  return useQuery({
    queryKey: queryKeys.feedDetail(id),
    queryFn: () => api.getFeed(id),
    enabled: !!id,
  });
}

// ── Entry queries ───────────────────────────────────────────────────────────

export function useEntries(filters: EntryFilters) {
  return useQuery({
    queryKey: queryKeys.entries(filters),
    queryFn: () => api.getEntries(filters),
  });
}

export function useEntry(id: string | null) {
  return useQuery({
    queryKey: queryKeys.entryDetail(id!),
    queryFn: () => api.getEntry(id!),
    enabled: !!id,
  });
}

// ── Category queries ────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: api.getCategories,
  });
}

// ── Feed mutations ──────────────────────────────────────────────────────────

export function useAddFeed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ url, categoryId }: { url: string; categoryId?: string }) =>
      api.addFeed(url, categoryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.feeds });
      qc.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useUpdateFeed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; categoryId?: string } }) =>
      api.updateFeed(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.feeds });
      qc.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useDeleteFeed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteFeed(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.feeds });
      qc.invalidateQueries({ queryKey: queryKeys.categories });
      qc.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}

export function useRefreshFeed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.refreshFeed(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.feeds });
      qc.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}

export function useRefreshAllFeeds() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.refreshAllFeeds,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.feeds });
      qc.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}

// ── Entry mutations ─────────────────────────────────────────────────────────

export function useUpdateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { readAt?: number; starred?: boolean } }) =>
      api.updateEntry(id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: queryKeys.entryDetail(variables.id) });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (feedId?: string) => api.markAllRead(feedId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: queryKeys.feeds });
    },
  });
}

// ── Category mutations ──────────────────────────────────────────────────────

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.createCategory(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; sortOrder?: number } }) =>
      api.updateCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories });
      qc.invalidateQueries({ queryKey: queryKeys.feeds });
    },
  });
}

// ── AI mutations ────────────────────────────────────────────────────────────

export function useSummarize() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, language = "en" }: { entryId: string; language?: string }) =>
      api.summarizeEntry(entryId, language),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.entryDetail(variables.entryId) });
    },
  });
}

export function useTranslate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, language }: { entryId: string; language: string }) =>
      api.translateEntry(entryId, language),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.entryDetail(variables.entryId) });
    },
  });
}
