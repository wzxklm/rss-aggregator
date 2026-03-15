import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "../db/client.js";
import { feeds, feedCategories } from "../db/schema.js";
import { logger } from "../logger.js";
import type { Feed, Result } from "../types/index.js";

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
