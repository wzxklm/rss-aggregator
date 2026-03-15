import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import RssParser from "rss-parser";
import { getDb } from "../db/client.js";
import { feeds, feedCategories, entries } from "../db/schema.js";
import { logger } from "../logger.js";
import type { Feed, Result } from "../types/index.js";

const rssParser = new RssParser();

const RSSHUB_PREFIX = "rsshub://";

/**
 * Resolve a feed URL — if it starts with `rsshub://`, replace the scheme
 * with the self-hosted RSSHub instance base URL from the RSSHUB_URL env var.
 *
 * Example: `rsshub://github/trending/weekly/any`
 *       → `http://rsshub:1200/github/trending/weekly/any`
 */
export function resolveRssHubUrl(url: string): string {
  if (!url.startsWith(RSSHUB_PREFIX)) return url;

  const base = process.env.RSSHUB_URL?.replace(/\/+$/, "");
  if (!base) {
    throw new Error("RSSHUB_URL environment variable is not set — cannot resolve rsshub:// URLs");
  }

  const route = url.slice(RSSHUB_PREFIX.length);
  return `${base}/${route}`;
}

export function createFeed(input: {
  url: string;
  title?: string;
  siteUrl?: string;
  description?: string;
  imageUrl?: string;
  categoryId?: string;
}): Result<Feed> {
  try {
    const db = getDb();
    const id = nanoid();
    const feed = db
      .insert(feeds)
      .values({
        id,
        url: input.url,
        title: input.title ?? null,
        siteUrl: input.siteUrl ?? null,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
      })
      .returning()
      .get();

    if (!feed) return { error: "Failed to create feed" };

    if (input.categoryId) {
      db.insert(feedCategories)
        .values({ feedId: id, categoryId: input.categoryId })
        .run();
    }

    logger.info({ feedId: id, url: input.url }, "Feed created");
    return { data: feed };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err, url: input.url }, "Failed to create feed");
    return { error: msg };
  }
}

export function getAllFeeds(categoryId?: string): Result<Feed[]> {
  try {
    const db = getDb();

    if (categoryId) {
      const rows = db
        .select({ feed: feeds })
        .from(feeds)
        .innerJoin(feedCategories, eq(feeds.id, feedCategories.feedId))
        .where(eq(feedCategories.categoryId, categoryId))
        .all()
        .map((r) => r.feed);
      return { data: rows };
    }

    const rows = db.select().from(feeds).all();
    return { data: rows };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

export function getFeedById(id: string): Result<Feed> {
  try {
    const db = getDb();
    const feed = db.select().from(feeds).where(eq(feeds.id, id)).get();
    if (!feed) return { error: "Feed not found" };
    return { data: feed };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

export function updateFeed(
  id: string,
  input: Partial<Pick<Feed, "title" | "siteUrl" | "description" | "imageUrl" | "lastFetchedAt" | "errorMessage">>,
): Result<Feed> {
  try {
    const db = getDb();
    const updated = db.update(feeds).set(input).where(eq(feeds.id, id)).returning().get();
    if (!updated) return { error: "Feed not found" };
    logger.debug({ feedId: id }, "Feed updated");
    return { data: updated };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

export function deleteFeed(id: string): Result<{ success: true }> {
  try {
    const db = getDb();
    const result = db.delete(feeds).where(eq(feeds.id, id)).run();
    if (result.changes === 0) return { error: "Feed not found" };
    logger.info({ feedId: id }, "Feed deleted");
    return { data: { success: true } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

// ── RSS Fetching ──────────────────────────────────────────────────────────

export interface ParsedFeedItem {
  guid: string;
  title: string | null;
  url: string | null;
  author: string | null;
  content: string | null;
  description: string | null;
  publishedAt: number;
}

export interface ParsedFeed {
  title: string | null;
  siteUrl: string | null;
  description: string | null;
  imageUrl: string | null;
  items: ParsedFeedItem[];
}

export async function fetchAndParseFeed(url: string): Promise<Result<ParsedFeed>> {
  try {
    const resolvedUrl = resolveRssHubUrl(url);
    const feed = await rssParser.parseURL(resolvedUrl);

    const items: ParsedFeedItem[] = (feed.items ?? []).map((item) => ({
      guid: item.guid ?? item.link ?? item.title ?? nanoid(),
      title: item.title ?? null,
      url: item.link ?? null,
      author: item.creator ?? item.author ?? null,
      content: item["content:encoded"] ?? item.content ?? null,
      description: item.contentSnippet ?? item.summary ?? null,
      publishedAt: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
    }));

    return {
      data: {
        title: feed.title ?? null,
        siteUrl: feed.link ?? null,
        description: feed.description ?? null,
        imageUrl: feed.image?.url ?? null,
        items,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ err, url }, `Feed fetch failed: "${url}" - ${msg}`);
    return { error: msg };
  }
}

export async function refreshFeed(feedId: string): Promise<Result<{ entriesAdded: number }>> {
  const feedResult = getFeedById(feedId);
  if (feedResult.error) return { error: feedResult.error };
  const feed = feedResult.data!;

  const parseResult = await fetchAndParseFeed(feed.url);
  if (parseResult.error) {
    updateFeed(feedId, { errorMessage: parseResult.error });
    return { error: parseResult.error };
  }

  const parsed = parseResult.data!;
  const db = getDb();
  let entriesAdded = 0;

  for (const item of parsed.items) {
    try {
      db.insert(entries)
        .values({
          id: nanoid(),
          feedId,
          guid: item.guid,
          title: item.title,
          url: item.url,
          author: item.author,
          content: item.content,
          description: item.description,
          publishedAt: item.publishedAt,
        })
        .run();
      entriesAdded++;
    } catch (err) {
      // UNIQUE constraint violation means duplicate — skip silently
      if (err instanceof Error && err.message.includes("UNIQUE constraint")) {
        continue;
      }
      logger.error({ err, feedId, guid: item.guid }, "Failed to insert entry");
    }
  }

  // Update feed metadata if this is the first successful fetch (no title yet)
  if (!feed.title && parsed.title) {
    updateFeed(feedId, {
      title: parsed.title,
      siteUrl: parsed.siteUrl ?? undefined,
      description: parsed.description ?? undefined,
      imageUrl: parsed.imageUrl ?? undefined,
    });
  }

  updateFeed(feedId, { lastFetchedAt: Date.now(), errorMessage: null });
  const displayTitle = feed.title ?? parsed.title;
  logger.info({ feedId, title: displayTitle, entriesAdded }, `Feed refreshed: "${displayTitle}" (+${entriesAdded} entries)`);

  return { data: { entriesAdded } };
}

export async function refreshAllFeeds(): Promise<Result<{ totalAdded: number; results: { feedId: string; entriesAdded?: number; error?: string }[] }>> {
  const allFeedsResult = getAllFeeds();
  if (allFeedsResult.error) return { error: allFeedsResult.error };
  const allFeeds = allFeedsResult.data!;

  const results: { feedId: string; entriesAdded?: number; error?: string }[] = [];
  let totalAdded = 0;

  for (const feed of allFeeds) {
    const result = await refreshFeed(feed.id);
    if (result.error) {
      results.push({ feedId: feed.id, error: result.error });
    } else {
      totalAdded += result.data!.entriesAdded;
      results.push({ feedId: feed.id, entriesAdded: result.data!.entriesAdded });
    }
  }

  logger.info({ totalAdded, feedCount: allFeeds.length }, `All feeds refreshed: ${totalAdded} new entries from ${allFeeds.length} feeds`);
  return { data: { totalAdded, results } };
}

export async function addFeed(input: {
  url: string;
  categoryId?: string;
}): Promise<Result<Feed>> {
  // Fetch and parse the feed first to extract metadata
  const parseResult = await fetchAndParseFeed(input.url);
  const metadata = parseResult.data;

  // Create the feed record with auto-extracted metadata
  const createResult = createFeed({
    url: input.url,
    title: metadata?.title ?? undefined,
    siteUrl: metadata?.siteUrl ?? undefined,
    description: metadata?.description ?? undefined,
    imageUrl: metadata?.imageUrl ?? undefined,
    categoryId: input.categoryId,
  });

  if (createResult.error) return createResult;
  const createdFeed = createResult.data!;

  // If parsing succeeded, insert initial entries
  if (metadata) {
    const db = getDb();
    let entriesAdded = 0;
    for (const item of metadata.items) {
      try {
        db.insert(entries)
          .values({
            id: nanoid(),
            feedId: createdFeed.id,
            guid: item.guid,
            title: item.title,
            url: item.url,
            author: item.author,
            content: item.content,
            description: item.description,
            publishedAt: item.publishedAt,
          })
          .run();
        entriesAdded++;
      } catch (err) {
        if (err instanceof Error && err.message.includes("UNIQUE constraint")) {
          continue;
        }
        logger.error({ err, feedId: createdFeed.id, guid: item.guid }, "Failed to insert entry");
      }
    }

    updateFeed(createdFeed.id, { lastFetchedAt: Date.now(), errorMessage: null });
    logger.info({ feedId: createdFeed.id, entriesAdded }, `Feed added with ${entriesAdded} initial entries`);
  } else {
    // Parsing failed but feed was still created — store the error
    updateFeed(createdFeed.id, { errorMessage: parseResult.error });
    logger.warn({ feedId: createdFeed.id, error: parseResult.error }, "Feed added but initial fetch failed");
  }

  // Return the updated feed (with metadata populated)
  return getFeedById(createdFeed.id);
}
