import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getDb } from "./client.js";
import { logger } from "../logger.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function runMigrations() {
  const migrationsFolder = path.resolve(__dirname, "../../drizzle/migrations");
  logger.info({ migrationsFolder }, "Running migrations");
  migrate(getDb(), { migrationsFolder });
  logger.info("Migrations complete");
}
