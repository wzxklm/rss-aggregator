import { Hono } from "hono";
import { aiService } from "@rss-agg/core";

export const aiRoutes = new Hono();

// POST /api/ai/summarize/:entryId
aiRoutes.post("/summarize/:entryId", async (c) => {
  const { entryId } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const language = (body as { language?: string }).language ?? "en";

  const result = await aiService.summarizeEntry(entryId, language);

  if ("error" in result) {
    const status = result.error === "Entry not found" ? 404 : 500;
    return c.json({ error: result.error }, status);
  }

  return c.json(result.data);
});

// POST /api/ai/translate/:entryId
aiRoutes.post("/translate/:entryId", async (c) => {
  const { entryId } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const language = (body as { language?: string }).language;

  if (!language) {
    return c.json({ error: "language is required" }, 400);
  }

  const result = await aiService.translateEntry(entryId, language);

  if ("error" in result) {
    const status = result.error === "Entry not found" ? 404 : 500;
    return c.json({ error: result.error }, status);
  }

  return c.json(result.data);
});
