import { useState, useEffect, useRef } from "react";
import { useParams, useOutletContext } from "react-router";
import Markdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEntries, useEntry, useUpdateEntry, useMarkAllRead, useSummarize, useTranslate } from "@/hooks/queries";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import type { Entry, EntryFilters } from "@/api/client";

export default function FeedsPage() {
  const params = useParams();
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "reader">("list");

  // Determine filters based on route
  const filters: EntryFilters = { limit: 50 };
  if (params.feedId) filters.feedId = params.feedId;
  if (params.categoryId) filters.categoryId = params.categoryId;
  if (searchQuery) filters.search = searchQuery;

  // Check current path for starred filter
  const isStarred = location.pathname === "/starred";
  if (isStarred) filters.starred = true;

  const { data, isLoading } = useEntries(filters);
  const entries = data?.entries ?? [];

  function handleSelectEntry(id: string) {
    setSelectedEntryId(id);
    setMobileView("reader");
  }

  function handleBackToList() {
    setMobileView("list");
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Entry List - hidden on mobile when viewing reader */}
      <div className={`w-full md:w-[360px] md:shrink-0 border-r flex flex-col min-h-0 ${mobileView === "reader" ? "hidden md:flex" : "flex"}`}>
        <EntryListToolbar filters={filters} />
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-3 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No entries found
            </div>
          ) : (
            <div className="divide-y">
              {entries.map((entry) => (
                <EntryListItem
                  key={entry.id}
                  entry={entry}
                  isSelected={entry.id === selectedEntryId}
                  onSelect={() => handleSelectEntry(entry.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Reader Panel - hidden on mobile when viewing list */}
      <div className={`flex-1 flex flex-col min-h-0 ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
        {selectedEntryId ? (
          <ReaderPanel
            entryId={selectedEntryId}
            onBack={handleBackToList}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select an entry to read
          </div>
        )}
      </div>
    </div>
  );
}

// ── EntryListToolbar ────────────────────────────────────────────────────────

function EntryListToolbar({ filters }: { filters: EntryFilters }) {
  const markAllRead = useMarkAllRead();

  function handleMarkAllRead() {
    markAllRead.mutate(filters.feedId, {
      onSuccess: (data) => toast.success(`Marked ${data.updated} entries as read`),
      onError: () => toast.error("Failed to mark entries as read"),
    });
  }

  return (
    <div className="flex items-center justify-between border-b px-3 py-2">
      <span className="text-sm font-medium">Entries</span>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleMarkAllRead}>
            Mark all as read
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── EntryListItem ───────────────────────────────────────────────────────────

function EntryListItem({
  entry,
  isSelected,
  onSelect,
}: {
  entry: Entry;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isUnread = entry.readAt === null;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 hover:bg-accent/50 transition-colors ${isSelected ? "bg-accent" : ""}`}
    >
      <div className="flex items-start gap-2">
        {isUnread && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
        <div className={`flex-1 min-w-0 ${!isUnread ? "ml-4" : ""}`}>
          <p className={`text-sm truncate ${isUnread ? "font-medium" : "text-muted-foreground"}`}>
            {entry.title ?? "Untitled"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(entry.publishedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        {entry.starred === 1 && (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500 shrink-0 mt-0.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        )}
      </div>
    </button>
  );
}

// ── ReaderPanel ─────────────────────────────────────────────────────────────

function ReaderPanel({ entryId, onBack }: { entryId: string; onBack: () => void }) {
  const { data: entry, isLoading } = useEntry(entryId);
  const updateEntry = useUpdateEntry();
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-mark as read after 2 seconds
  useEffect(() => {
    if (entry && entry.readAt === null) {
      markReadTimerRef.current = setTimeout(() => {
        updateEntry.mutate({
          id: entryId,
          data: { readAt: Date.now() },
        });
      }, 2000);
    }
    return () => {
      if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    };
  }, [entryId, entry?.readAt]);

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Entry not found
      </div>
    );
  }

  const isStarred = entry.starred === 1;

  function toggleStar() {
    updateEntry.mutate({
      id: entryId,
      data: { starred: !isStarred },
    });
  }

  const sanitizedContent = entry.content
    ? DOMPurify.sanitize(entry.content)
    : entry.description
      ? DOMPurify.sanitize(entry.description)
      : null;

  return (
    <ScrollArea className="flex-1">
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {/* Mobile back button */}
        <Button variant="ghost" size="sm" onClick={onBack} className="md:hidden -ml-2 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </Button>

        {/* Title & metadata */}
        <div>
          <h1 className="text-2xl font-bold leading-tight">{entry.title ?? "Untitled"}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            {entry.author && <span>{entry.author}</span>}
            <span>{new Date(entry.publishedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleStar}>
            {isStarred ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500 mr-1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            )}
            {isStarred ? "Starred" : "Star"}
          </Button>
          {entry.url && (
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-sm font-medium hover:bg-muted"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Original
            </a>
          )}
        </div>

        {/* AI Panel */}
        <AIPanel key={entry.id} entryId={entry.id} summaries={entry.summaries} translations={entry.translations} />

        <Separator />

        {/* Content */}
        {sanitizedContent ? (
          <article
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        ) : (
          <p className="text-muted-foreground text-sm">No content available</p>
        )}
      </div>
    </ScrollArea>
  );
}

// ── AIPanel ─────────────────────────────────────────────────────────────────

function AIPanel({
  entryId,
  summaries,
  translations,
}: {
  entryId: string;
  summaries: { id: string; summary: string; language: string }[];
  translations: { id: string; title: string | null; content: string | null; language: string }[];
}) {
  const summarize = useSummarize();
  const translate = useTranslate();
  const [targetLang, setTargetLang] = useState("zh");

  const existingSummary = summaries.find((s) => s.language === targetLang);
  const existingTranslation = translations.find((t) => t.language === targetLang);

  function handleSummarize() {
    summarize.mutate(
      { entryId, language: targetLang },
      {
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to summarize"),
      },
    );
  }

  function handleTranslate() {
    translate.mutate(
      { entryId, language: targetLang },
      {
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to translate"),
      },
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSummarize}
            disabled={summarize.isPending}
          >
            {summarize.isPending ? "Summarizing..." : "Summarize"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTranslate}
            disabled={translate.isPending}
          >
            {translate.isPending ? "Translating..." : "Translate"}
          </Button>
        </div>
        <select
          className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
        >
          <option value="zh">Chinese</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
        </select>
      </div>

      {/* Summary result */}
      {(existingSummary || summarize.data) && (
        <div className="rounded-md border p-3 bg-muted/50">
          <h4 className="text-xs font-medium text-muted-foreground mb-1">Summary</h4>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <Markdown>{summarize.data?.summary ?? existingSummary?.summary}</Markdown>
          </div>
        </div>
      )}

      {/* Translation result */}
      {(existingTranslation || translate.data) && (
        <div className="rounded-md border p-3 bg-muted/50">
          <h4 className="text-xs font-medium text-muted-foreground mb-1">
            Translation ({translate.data?.language ?? existingTranslation?.language})
          </h4>
          {(translate.data?.title ?? existingTranslation?.title) && (
            <p className="text-sm font-medium mb-1">
              {translate.data?.title ?? existingTranslation?.title}
            </p>
          )}
          {(translate.data?.content ?? existingTranslation?.content) && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <Markdown>{translate.data?.content ?? existingTranslation?.content}</Markdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
