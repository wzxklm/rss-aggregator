import { Hono } from "hono";
import { categoryService } from "@wzxklm/rss-agg-core";

const categoryRoutes = new Hono();

// GET /api/categories
categoryRoutes.get("/", (c) => {
  const result = categoryService.getAllCategories();
  if (result.error) return c.json({ error: result.error }, 500);
  return c.json(result.data);
});

// POST /api/categories
categoryRoutes.post("/", async (c) => {
  const body = await c.req.json<{ name?: string }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);

  const result = categoryService.createCategory({ name: body.name });
  if (result.error) return c.json({ error: result.error }, 400);
  return c.json(result.data, 201);
});

// PATCH /api/categories/:id
categoryRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ name?: string; sortOrder?: number }>();

  const result = categoryService.updateCategory(id, {
    name: body.name,
    sortOrder: body.sortOrder,
  });
  if (result.error) return c.json({ error: result.error }, 404);
  return c.json(result.data);
});

// DELETE /api/categories/:id
categoryRoutes.delete("/:id", (c) => {
  const result = categoryService.deleteCategory(c.req.param("id"));
  if (result.error) return c.json({ error: result.error }, 404);
  return c.json(result.data);
});

export { categoryRoutes };
