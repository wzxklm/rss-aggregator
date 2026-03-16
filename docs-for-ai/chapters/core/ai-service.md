# AI Service — Summarization and translation with OpenAI-compatible API and DB caching

## Overview

Provides AI-powered summarization and translation of entry content. Uses an OpenAI-compatible chat completions API (configurable endpoint) with results cached in the database to avoid redundant API calls. Raw HTML content is sent directly to the AI, which returns Markdown-formatted results.

## Key Behaviors

- **Lazy Singleton Client**: OpenAI client created on first use via `getClient()`. Configured by `AI_BASE_URL` and `AI_API_KEY` env vars.
- **Cache-First**: Both `summarizeEntry` and `translateEntry` check the DB (summaries/translations table) before making an API call. Cache key is `(entryId, language)`.
- **Content Preparation**: Sends raw HTML content directly to AI (no stripping or truncation). Falls back from `content` to `description` if content is null.
- **Error Handling**: Specific messages for 429 (rate limit), 401 (auth), connection errors. Generic fallback for other API errors.
- **Default Model**: `gpt-4o-mini` unless overridden by `AI_MODEL` env var.
- **Translation JSON Parsing**: AI returns JSON with `title` (plain text) and `content` (Markdown) fields. Strips markdown code fences before parsing. Returns error on invalid JSON.

## Interface

| Function | Signature | Notes |
|----------|-----------|-------|
| `summarizeEntry` | `(entryId, language?) -> Promise<Result<Summary>>` | language defaults to "en" |
| `translateEntry` | `(entryId, targetLanguage) -> Promise<Result<Translation>>` | Returns translated title + content |

### Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `AI_BASE_URL` | No | OpenAI default | API endpoint URL |
| `AI_API_KEY` | Yes (for AI features) | -- | API authentication key |
| `AI_MODEL` | No | `gpt-4o-mini` | Model identifier |

## Internal Details

- **Language name mapping**: `LANGUAGE_NAMES` record maps ISO codes (`zh`, `en`, `es`, `fr`, `de`, `ja`, `ko`) to full names (`Simplified Chinese`, `English`, etc.). `langName(code)` resolves the name; falls back to raw code if unmapped.
- **Summarization prompt**: System message instructs 2-4 sentence Markdown summary with `MUST write in ${langName(language)}`. Input is raw HTML. User message includes title + HTML content.
- **Translation prompt**: System message requests JSON output with `title` (plain text) and `content` (Markdown, preserving original formatting/layout) fields, targeting `${langName(targetLanguage)}`. Input is raw HTML. Response parsed with `JSON.parse` after stripping code fences.
- **Cache storage**: After successful API call, result is inserted into `summaries` or `translations` table with `nanoid()` PK. Unique index on `(entryId, language)` prevents duplicate cache entries.
- **Timing**: Logs elapsed seconds for each API call.
- **handleAiError**: Shared error handler distinguishes `OpenAI.APIError` (with status codes), `OpenAI.APIConnectionError`, and generic errors.

## Dependencies

- Uses: DB Client (`getDb`), Schema (`entries`, `summaries`, `translations`), Logger, `nanoid`, `openai` npm package
- Used by: API AI Routes, CLI AI Commands

## Security

- `AI_API_KEY` is read from env var at runtime; not logged or exposed.
- Raw HTML sent directly to AI API; no input sanitization (relies on AI to handle arbitrary HTML).
