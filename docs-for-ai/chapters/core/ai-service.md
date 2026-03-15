# AI Service — Summarization and translation with OpenAI-compatible API and DB caching

## Overview

Provides AI-powered summarization and translation of entry content. Uses an OpenAI-compatible chat completions API (configurable endpoint) with results cached in the database to avoid redundant API calls. Content is preprocessed from HTML to plain text before sending to the AI.

## Key Behaviors

- **Lazy Singleton Client**: OpenAI client created on first use via `getClient()`. Configured by `AI_BASE_URL` and `AI_API_KEY` env vars.
- **Cache-First**: Both `summarizeEntry` and `translateEntry` check the DB (summaries/translations table) before making an API call. Cache key is `(entryId, language)`.
- **Content Preparation**: Uses `htmlToText()` to strip HTML and truncate to 8000 chars. Falls back from `content` to `description` if content is null.
- **Error Handling**: Specific messages for 429 (rate limit), 401 (auth), connection errors. Generic fallback for other API errors.
- **Default Model**: `gpt-4o-mini` unless overridden by `AI_MODEL` env var.
- **Translation JSON Parsing**: AI returns JSON with `title` and `content` fields. Strips markdown code fences before parsing. Returns error on invalid JSON.

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

- **Summarization prompt**: System message instructs 2-4 sentence summary in target language. User message includes title + plain text content.
- **Translation prompt**: System message requests JSON output with `title` and `content` fields in target language. Response parsed with `JSON.parse` after stripping code fences.
- **Cache storage**: After successful API call, result is inserted into `summaries` or `translations` table with `nanoid()` PK. Unique index on `(entryId, language)` prevents duplicate cache entries.
- **Timing**: Logs elapsed seconds for each API call.
- **handleAiError**: Shared error handler distinguishes `OpenAI.APIError` (with status codes), `OpenAI.APIConnectionError`, and generic errors.

## Dependencies

- Uses: DB Client (`getDb`), Schema (`entries`, `summaries`, `translations`), Logger, `nanoid`, `openai` npm package, `htmlToText` utility
- Used by: API AI Routes, CLI AI Commands

## Security

- `AI_API_KEY` is read from env var at runtime; not logged or exposed.
- No input sanitization on entry content beyond HTML stripping (relies on AI API to handle arbitrary text).
