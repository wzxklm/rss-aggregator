import { runMigrations } from "@wzxklm/rss-agg-core";

let dbReady = false;

export function initDb(): void {
  if (!dbReady) {
    runMigrations();
    dbReady = true;
  }
}

export function success<T>(data: T): never {
  console.log(JSON.stringify({ data }));
  process.exit(0);
}

export function fail(message: string): never {
  console.log(JSON.stringify({ error: message }));
  process.exit(1);
}
