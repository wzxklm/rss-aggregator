import { sqliteTable, text, integer, primaryKey, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ── feeds ──────────────────────────────────────────────────────────────────

export const feeds = sqliteTable("feeds", {
  id: text("id").primaryKey(),
  title: text("title"),
  url: text("url").notNull().unique(),
  siteUrl: text("site_url"),
  description: text("description"),
  imageUrl: text("image_url"),
  lastFetchedAt: integer("last_fetched_at"),
  errorMessage: text("error_message"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ── categories ─────────────────────────────────────────────────────────────

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ── feed_categories (M:N join) ─────────────────────────────────────────────

export const feedCategories = sqliteTable(
  "feed_categories",
  {
    feedId: text("feed_id")
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.feedId, table.categoryId] }),
  ],
);

// ── entries ────────────────────────────────────────────────────────────────

export const entries = sqliteTable(
  "entries",
  {
    id: text("id").primaryKey(),
    feedId: text("feed_id")
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),
    guid: text("guid").notNull(),
    title: text("title"),
    url: text("url"),
    author: text("author"),
    content: text("content"),
    description: text("description"),
    publishedAt: integer("published_at").notNull(),
    readAt: integer("read_at"),
    starred: integer("starred").notNull().default(0),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex("entries_feed_guid_unique").on(table.feedId, table.guid),
  ],
);

// ── summaries ──────────────────────────────────────────────────────────────

export const summaries = sqliteTable(
  "summaries",
  {
    id: text("id").primaryKey(),
    entryId: text("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    summary: text("summary").notNull(),
    language: text("language").notNull().default("en"),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex("summaries_entry_language_unique").on(table.entryId, table.language),
  ],
);

// ── translations ───────────────────────────────────────────────────────────

export const translations = sqliteTable(
  "translations",
  {
    id: text("id").primaryKey(),
    entryId: text("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    title: text("title"),
    content: text("content"),
    language: text("language").notNull(),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex("translations_entry_language_unique").on(table.entryId, table.language),
  ],
);
