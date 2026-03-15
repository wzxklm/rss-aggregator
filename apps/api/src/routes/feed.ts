import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { feedService, getDb, schema } from "@wzxklm/rss-agg-core";

const feedRoutes = new Hono();

// GET /api/feeds
feedRoutes.get("/", (c) => {
  const categoryId = c.req.query("categoryId");
  const result = feedService.getAllFeeds(categoryId);
  if (result.error) return c.json({ error: result.error }, 500);
  return c.json(result.data);
});

// GET /api/feeds/:id
feedRoutes.get("/:id", (c) => {
  const result = feedService.getFeedById(c.req.param("id"));
  if (result.error) return c.json({ error: result.error }, 404);
  return c.json(result.data);
});

// POST /api/feeds
feedRoutes.post("/", async (c) => {
  const body = await c.req.json<{ url?: string; categoryId?: string }>();
  if (!body.url) return c.json({ error: "url is required" }, 400);

  const result = await feedService.addFeed({
    url: body.url,
    categoryId: body.categoryId,
  });
  if (result.error) return c.json({ error: result.error }, 400);
  return c.json(result.data, 201);
});

// PATCH /api/feeds/:id
feedRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ title?: string; categoryId?: string }>();

  const result = feedService.updateFeed(id, {
    title: body.title,
  });
  if (result.error) return c.json({ error: result.error }, 404);

  // Handle category update if provided
  if (body.categoryId !== undefined) {
    const db = getDb();
    // Remove existing category associations
    db.delete(schema.feedCategories)
      .where(eq(schema.feedCategories.feedId, id))
      .run();

    // Add new category association if provided
    if (body.categoryId) {
      db.insert(schema.feedCategories)
        .values({ feedId: id, categoryId: body.categoryId })
        .run();
    }
  }

  return c.json(result.data);
});

// DELETE /api/feeds/:id
feedRoutes.delete("/:id", (c) => {
  const result = feedService.deleteFeed(c.req.param("id"));
  if (result.error) return c.json({ error: result.error }, 404);
  return c.json(result.data);
});

// POST /api/feeds/:id/refresh
feedRoutes.post("/:id/refresh", async (c) => {
  const result = await feedService.refreshFeed(c.req.param("id"));
  if (result.error) return c.json({ error: result.error }, 400);
  return c.json(result.data);
});

// POST /api/feeds/refresh-all
feedRoutes.post("/refresh-all", async (c) => {
  const result = await feedService.refreshAllFeeds();
  if (result.error) return c.json({ error: result.error }, 500);
  return c.json({ totalAdded: result.data!.totalAdded });
});

export { feedRoutes };
