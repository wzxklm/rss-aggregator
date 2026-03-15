import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema.js";
import { logger } from "../logger.js";

const DATABASE_PATH = process.env["DATABASE_PATH"] ?? "./data/rss-agg.db";

let db: ReturnType<typeof createDb> | undefined;

function createDb() {
  logger.info({ path: DATABASE_PATH }, "Opening database");
  const sqlite = new Database(DATABASE_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

export function getDb() {
  if (!db) {
    db = createDb();
  }
  return db;
}

export type AppDatabase = ReturnType<typeof getDb>;
