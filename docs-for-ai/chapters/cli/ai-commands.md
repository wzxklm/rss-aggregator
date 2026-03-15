# AI Commands — ai summarize/translate

## Overview

Registers the `ai` command group with two subcommands for AI-powered entry processing. Both commands accept a `--lang` option defaulting to `"en"` and delegate to `aiService` from core.

## Key Behaviors

- **Default language**: Both `summarize` and `translate` default `--lang` to `"en"` via Commander's default value
- **Async**: Both actions are `async` — AI service calls are asynchronous (external API calls)
- **Standard error handling**: Both follow the same pattern: `initDb()`, call service, check `result.error`, then `success(result.data)`

## Interface

`registerAiCommands(program: Command) → void`

### Commands

| Command | Args | Options | Description |
|---------|------|---------|-------------|
| `ai summarize` | `<entryId>` (required) | `--lang <code>` (default `"en"`) | AI-generated summary of an entry |
| `ai translate` | `<entryId>` (required) | `--lang <code>` (default `"en"`) | AI-generated translation of an entry |

## Internal Details

Minimal module — each subcommand is a direct pass-through to `aiService.summarizeEntry(entryId, lang)` and `aiService.translateEntry(entryId, lang)` respectively. No local logic beyond the standard `initDb` / error-check / output pattern.

## Dependencies

- Uses: `aiService` (from `@wzxklm/rss-agg-core`), `initDb`, `success`, `fail` (from `../output.js`)
- Used by: Main Entry (`index.ts`)
