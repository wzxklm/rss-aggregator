import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { feeds, categories, feedCategories, entries, summaries, translations } from "../db/schema.js";

// ── Select types (rows returned from DB) ───────────────────────────────────

export type Feed = InferSelectModel<typeof feeds>;
export type Category = InferSelectModel<typeof categories>;
export type FeedCategory = InferSelectModel<typeof feedCategories>;
export type Entry = InferSelectModel<typeof entries>;
export type Summary = InferSelectModel<typeof summaries>;
export type Translation = InferSelectModel<typeof translations>;

// ── Insert types (rows going into DB) ──────────────────────────────────────

export type NewFeed = InferInsertModel<typeof feeds>;
export type NewCategory = InferInsertModel<typeof categories>;
export type NewFeedCategory = InferInsertModel<typeof feedCategories>;
export type NewEntry = InferInsertModel<typeof entries>;
export type NewSummary = InferInsertModel<typeof summaries>;
export type NewTranslation = InferInsertModel<typeof translations>;

// ── Service result type ────────────────────────────────────────────────────

export type Result<T> =
  | { data: T; error?: never }
  | { data?: never; error: string };
