import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "../db/client.js";
import { categories, feedCategories } from "../db/schema.js";
import { logger } from "../logger.js";
import type { Category, Result } from "../types/index.js";

export function createCategory(input: {
  name: string;
  sortOrder?: number;
}): Result<Category> {
  try {
    const db = getDb();
    const id = nanoid();
    const category = db
      .insert(categories)
      .values({
        id,
        name: input.name,
        sortOrder: input.sortOrder ?? 0,
      })
      .returning()
      .get();

    if (!category) return { error: "Failed to create category" };
    logger.info({ categoryId: id, name: input.name }, "Category created");
    return { data: category };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err, name: input.name }, "Failed to create category");
    return { error: msg };
  }
}

export function getAllCategories(): Result<(Category & { feedCount: number })[]> {
  try {
    const db = getDb();
    const rows = db
      .select({
        id: categories.id,
        name: categories.name,
        sortOrder: categories.sortOrder,
        feedCount: sql<number>`count(${feedCategories.feedId})`,
      })
      .from(categories)
      .leftJoin(feedCategories, eq(categories.id, feedCategories.categoryId))
      .groupBy(categories.id)
      .orderBy(categories.sortOrder)
      .all();

    return { data: rows };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

export function updateCategory(
  id: string,
  input: Partial<Pick<Category, "name" | "sortOrder">>,
): Result<Category> {
  try {
    const db = getDb();
    const updated = db
      .update(categories)
      .set(input)
      .where(eq(categories.id, id))
      .returning()
      .get();
    if (!updated) return { error: "Category not found" };
    logger.debug({ categoryId: id }, "Category updated");
    return { data: updated };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

export function deleteCategory(id: string): Result<{ success: true }> {
  try {
    const db = getDb();
    const result = db.delete(categories).where(eq(categories.id, id)).run();
    if (result.changes === 0) return { error: "Category not found" };
    logger.info({ categoryId: id }, "Category deleted");
    return { data: { success: true } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}
