import { eq, and, like, desc, sql, lte, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "../db/client.js";
import { entries, feedCategories } from "../db/schema.js";
import { logger } from "../logger.js";
import type { Entry, NewEntry, Result } from "../types/index.js";

export function createEntry(
  input: Omit<NewEntry, "id" | "createdAt">,
): Result<Entry> {
  try {
    const db = getDb();
    const id = nanoid();
    const entry = db
      .insert(entries)
      .values({ ...input, id })
      .returning()
      .get();

    if (!entry) return { error: "Failed to create entry" };
    return { data: entry };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err, feedId: input.feedId }, "Failed to create entry");
    return { error: msg };
  }
}

export function listEntries(filters?: {
  feedId?: string;
  categoryId?: string;
  starred?: boolean;
  unread?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}): Result<{ entries: Entry[]; total: number }> {
  try {
    const db = getDb();
    const conditions = [];

    if (filters?.feedId) {
      conditions.push(eq(entries.feedId, filters.feedId));
    }
    if (filters?.categoryId) {
      const feedIds = db
        .select({ feedId: feedCategories.feedId })
        .from(feedCategories)
        .where(eq(feedCategories.categoryId, filters.categoryId))
        .all()
        .map((r) => r.feedId);
      if (feedIds.length > 0) {
        conditions.push(inArray(entries.feedId, feedIds));
      } else {
        // No feeds in this category — return empty
        return { data: { entries: [], total: 0 } };
      }
    }
    if (filters?.starred) {
      conditions.push(eq(entries.starred, 1));
    }
    if (filters?.unread) {
      conditions.push(sql`${entries.readAt} IS NULL`);
    }
    if (filters?.search) {
      conditions.push(like(entries.title, `%${filters.search}%`));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const rows = db
      .select()
      .from(entries)
      .where(where)
      .orderBy(desc(entries.publishedAt))
      .limit(limit)
      .offset(offset)
      .all();

    const [countRow] = db
      .select({ count: sql<number>`count(*)` })
      .from(entries)
      .where(where)
      .all();

    return { data: { entries: rows, total: countRow?.count ?? 0 } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

export function getEntryById(id: string): Result<Entry> {
  try {
    const db = getDb();
    const entry = db.select().from(entries).where(eq(entries.id, id)).get();
    if (!entry) return { error: "Entry not found" };
    return { data: entry };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

export function updateEntry(
  id: string,
  input: Partial<Pick<Entry, "readAt" | "starred">>,
): Result<Entry> {
  try {
    const db = getDb();
    const updated = db
      .update(entries)
      .set(input)
      .where(eq(entries.id, id))
      .returning()
      .get();
    if (!updated) return { error: "Entry not found" };
    return { data: updated };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

export function markRead(
  id: string,
  readAt?: number,
): Result<Entry> {
  return updateEntry(id, { readAt: readAt ?? Date.now() });
}

export function markAllRead(filters?: {
  feedId?: string;
  before?: number;
}): Result<{ updated: number }> {
  try {
    const db = getDb();
    const now = Date.now();
    const conditions = [sql`${entries.readAt} IS NULL`];

    if (filters?.feedId) {
      conditions.push(eq(entries.feedId, filters.feedId));
    }
    if (filters?.before) {
      conditions.push(lte(entries.publishedAt, filters.before));
    }

    const result = db
      .update(entries)
      .set({ readAt: now })
      .where(and(...conditions))
      .run();

    return { data: { updated: result.changes } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}
