import OpenAI from "openai";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "../db/client.js";
import { entries, summaries, translations } from "../db/schema.js";
import { logger } from "../logger.js";
import { htmlToText } from "../utils/index.js";
import type { Summary, Translation, Result } from "../types/index.js";

// ── AI client (lazy singleton) ────────────────────────────────────────────

let client: OpenAI | undefined;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      baseURL: process.env["AI_BASE_URL"],
      apiKey: process.env["AI_API_KEY"],
    });
  }
  return client;
}

function getModel(): string {
  return process.env["AI_MODEL"] ?? "gpt-4o-mini";
}

// ── Summarize ─────────────────────────────────────────────────────────────

export async function summarizeEntry(
  entryId: string,
  language = "en",
): Promise<Result<Summary>> {
  try {
    const db = getDb();

    // Check cache
    const cached = db
      .select()
      .from(summaries)
      .where(and(eq(summaries.entryId, entryId), eq(summaries.language, language)))
      .get();

    if (cached) {
      logger.info({ entryId, language }, `AI summarize: entry "${entryId}" (cached)`);
      return { data: cached };
    }

    // Fetch entry
    const entry = db.select().from(entries).where(eq(entries.id, entryId)).get();
    if (!entry) return { error: "Entry not found" };

    const text = htmlToText(entry.content ?? entry.description ?? "");
    if (!text) return { error: "Entry has no content to summarize" };

    // Call AI API
    const start = Date.now();
    const response = await getClient().chat.completions.create({
      model: getModel(),
      messages: [
        {
          role: "system",
          content: `You are a content summarizer. Provide a concise summary (2-4 sentences) of the following article.\nRespond in ${language}. Focus on key points and takeaways.\nOutput only the summary text, no prefixes or labels.`,
        },
        {
          role: "user",
          content: `Title: ${entry.title ?? ""}\n\n${text}`,
        },
      ],
    });

    const summaryText = response.choices[0]?.message?.content?.trim();
    if (!summaryText) return { error: "AI returned empty response" };

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    logger.info({ entryId, language, elapsed }, `AI summarize: entry "${entryId}" → ${language} (API call, ${elapsed}s)`);

    // Store result
    const row = db
      .insert(summaries)
      .values({ id: nanoid(), entryId, summary: summaryText, language })
      .returning()
      .get();

    if (!row) return { error: "Failed to store summary" };
    return { data: row };
  } catch (err) {
    return handleAiError(err, "summarize");
  }
}

// ── Translate ─────────────────────────────────────────────────────────────

export async function translateEntry(
  entryId: string,
  targetLanguage: string,
): Promise<Result<Translation>> {
  try {
    const db = getDb();

    // Check cache
    const cached = db
      .select()
      .from(translations)
      .where(and(eq(translations.entryId, entryId), eq(translations.language, targetLanguage)))
      .get();

    if (cached) {
      logger.info({ entryId, targetLanguage }, `AI translate: entry "${entryId}" (cached)`);
      return { data: cached };
    }

    // Fetch entry
    const entry = db.select().from(entries).where(eq(entries.id, entryId)).get();
    if (!entry) return { error: "Entry not found" };

    const text = htmlToText(entry.content ?? entry.description ?? "");
    if (!text) return { error: "Entry has no content to translate" };

    // Call AI API
    const start = Date.now();
    const response = await getClient().chat.completions.create({
      model: getModel(),
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following content to ${targetLanguage}.\nMaintain the original meaning, tone, and structure.\nReturn a JSON object with "title" and "content" fields.`,
        },
        {
          role: "user",
          content: `Title: ${entry.title ?? ""}\n\n${text}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) return { error: "AI returned empty response" };

    let parsed: { title?: string; content?: string };
    try {
      // Strip markdown code fences if present
      const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      parsed = JSON.parse(jsonStr);
    } catch {
      return { error: "AI returned invalid JSON for translation" };
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    logger.info({ entryId, targetLanguage, elapsed }, `AI translate: entry "${entryId}" → ${targetLanguage} (API call, ${elapsed}s)`);

    // Store result
    const row = db
      .insert(translations)
      .values({
        id: nanoid(),
        entryId,
        title: parsed.title ?? null,
        content: parsed.content ?? null,
        language: targetLanguage,
      })
      .returning()
      .get();

    if (!row) return { error: "Failed to store translation" };
    return { data: row };
  } catch (err) {
    return handleAiError(err, "translate");
  }
}

// ── Error handling ────────────────────────────────────────────────────────

function handleAiError(err: unknown, operation: string): { error: string } {
  if (err instanceof OpenAI.APIError) {
    const { status, message } = err;
    if (status === 429) {
      logger.error({ status }, "AI API error: 429 Rate Limited");
      return { error: "AI rate limit exceeded. Please try again later." };
    }
    if (status === 401) {
      logger.error({ status }, "AI API error: 401 Unauthorized");
      return { error: "Invalid AI API key." };
    }
    logger.error({ status, message }, `AI API error: ${status} ${message}`);
    return { error: `AI API error: ${message}` };
  }

  if (err instanceof OpenAI.APIConnectionError) {
    logger.error({ err }, "AI API connection error");
    return { error: "Failed to connect to AI API. Check AI_BASE_URL." };
  }

  const msg = err instanceof Error ? err.message : String(err);
  logger.error({ err }, `AI ${operation} error: ${msg}`);
  return { error: msg };
}
