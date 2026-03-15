# AI Routes — Summarize and translate entries via AI

## Overview

Exposes two AI-powered endpoints for generating summaries and translations of feed entries. Both require auth and delegate to `aiService` from core. Results are cached by the service layer.

## Key Behaviors

- **Summarize**: Generates AI summary of entry content. `language` defaults to `"en"` if not provided in body. Body parse failure silently defaults to empty object
- **Translate**: Translates entry content to specified language. `language` is required -- returns 400 if missing
- **Error handling**: Checks for `"error" in result` pattern (different from other routes which check `result.error`). Maps `"Entry not found"` to 404, all other errors to 500

## Interface

| Endpoint | Method | Auth | Request | Response |
|----------|--------|------|---------|----------|
| `/api/ai/summarize/:entryId` | POST | Yes | Param: `entryId`; Body: `{language?: string}` (default `"en"`) | Summary object |
| `/api/ai/translate/:entryId` | POST | Yes | Param: `entryId`; Body: `{language: string}` (required) | Translation object |

## Internal Details

- Body parsed with `.catch(() => ({}))` -- missing/malformed JSON body doesn't throw
- Language extracted via cast: `(body as {language?: string}).language`
- Error check uses `"error" in result` instead of `result.error` -- different pattern from feed/entry/category routes

## Dependencies

- Uses: `aiService` (core)
- Used by: Web frontend, CLI (via HTTP)
