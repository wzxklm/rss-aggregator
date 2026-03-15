// @rss-agg/core — public API barrel export

// Database
export { getDb, type AppDatabase } from "./db/client.js";
export { runMigrations } from "./db/migrate.js";
export * as schema from "./db/schema.js";

// Logger
export { logger } from "./logger.js";

// Services
export * as feedService from "./services/feed.js";
export * as entryService from "./services/entry.js";
export * as categoryService from "./services/category.js";
export * as schedulerService from "./services/scheduler.js";
export * as aiService from "./services/ai.js";

// Utilities
export { htmlToText } from "./utils/index.js";

// Types
export type {
  Feed,
  Category,
  FeedCategory,
  Entry,
  Summary,
  Translation,
  NewFeed,
  NewCategory,
  NewFeedCategory,
  NewEntry,
  NewSummary,
  NewTranslation,
  Result,
} from "./types/index.js";
