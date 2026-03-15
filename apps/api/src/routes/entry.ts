import { Hono } from "hono";
import { entryService, getDb, schema } from "@wzxklm/rss-agg-core";
import { eq } from "drizzle-orm";

const entryRoutes = new Hono();

// GET /api/entries
entryRoutes.get("/", (c) => {
  const query = c.req.query();
  const result = entryService.listEntries({
    feedId: query["feedId"],
    categoryId: query["categoryId"],
    starred: query["starred"] === "true",
    unread: query["unread"] === "true",
    search: query["search"],
    limit: query["limit"] ? Number(query["limit"]) : undefined,
    offset: query["offset"] ? Number(query["offset"]) : undefined,
  });
  if (result.error) return c.json({ error: result.error }, 500);
  return c.json(result.data);
});

// GET /api/entries/:id
entryRoutes.get("/:id", (c) => {
  const id = c.req.param("id");
  const result = entryService.getEntryById(id);
  if (result.error) return c.json({ error: result.error }, 404);

  // Include summary and translation if available
  const db = getDb();
  const summaryRows = db
    .select()
    .from(schema.summaries)
    .where(eq(schema.summaries.entryId, id))
    .all();
  const translationRows = db
    .select()
    .from(schema.translations)
    .where(eq(schema.translations.entryId, id))
    .all();

  return c.json({
    ...result.data,
    summaries: summaryRows,
    translations: translationRows,
  });
});

// PATCH /api/entries/:id
entryRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ readAt?: number; starred?: boolean }>();

  const input: { readAt?: number; starred?: number } = {};
  if (body.readAt !== undefined) input.readAt = body.readAt;
  if (body.starred !== undefined) input.starred = body.starred ? 1 : 0;

  const result = entryService.updateEntry(id, input);
  if (result.error) return c.json({ error: result.error }, 404);
  return c.json(result.data);
});

// POST /api/entries/mark-all-read
entryRoutes.post("/mark-all-read", async (c) => {
  const body = await c.req.json<{ feedId?: string; before?: number }>().catch(
    () => ({} as { feedId?: string; before?: number }),
  );
  const result = entryService.markAllRead({
    feedId: body.feedId,
    before: body.before,
  });
  if (result.error) return c.json({ error: result.error }, 500);
  return c.json(result.data);
});

export { entryRoutes };
