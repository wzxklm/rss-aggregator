import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { runMigrations, logger, schedulerService } from "@rss-agg/core";
import { auth, requireAuth } from "./middleware/auth.js";
import { feedRoutes } from "./routes/feed.js";
import { entryRoutes } from "./routes/entry.js";
import { categoryRoutes } from "./routes/category.js";
import { helpRoute } from "./routes/help.js";
import { aiRoutes } from "./routes/ai.js";

const app = new Hono();

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Request logging ───────────────────────────────────────────────────────
app.use("/api/*", async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info(
    { method: c.req.method, path: c.req.path, status: c.res.status, ms },
    `${c.req.method} ${c.req.path} ${c.res.status} ${ms}ms`,
  );
});

// ── Public routes (no auth) ───────────────────────────────────────────────
app.route("/api/auth", auth);
app.route("/api/help", helpRoute);

// ── Auth-protected routes ─────────────────────────────────────────────────
app.use("/api/feeds/*", requireAuth);
app.use("/api/entries/*", requireAuth);
app.use("/api/categories/*", requireAuth);
app.use("/api/ai/*", requireAuth);

app.route("/api/feeds", feedRoutes);
app.route("/api/entries", entryRoutes);
app.route("/api/categories", categoryRoutes);
app.route("/api/ai", aiRoutes);

// ── Static frontend (production) ─────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = process.env["STATIC_DIR"] ?? path.resolve(__dirname, "../../web/dist");

if (fs.existsSync(staticDir)) {
  logger.info({ staticDir }, "Serving static frontend");
  app.use("/*", serveStatic({ root: staticDir, rewriteRequestPath: (p) => p }));
  app.get("*", async (c) => {
    const html = fs.readFileSync(path.join(staticDir, "index.html"), "utf-8");
    return c.html(html);
  });
}

// ── Start server ──────────────────────────────────────────────────────────
const port = Number(process.env["API_PORT"] ?? 3000);

// Run migrations before starting
runMigrations();

// Start the cron scheduler
schedulerService.startScheduler();

serve({ fetch: app.fetch, port }, () => {
  logger.info({ port }, `Server started on port ${port}`);
});

export { app };
