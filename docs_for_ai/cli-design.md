# CLI Design

The CLI tool name is `rss-agg`. **The CLI is designed for AI Agents**, not human users. All output is **JSON only** — no tables, colors, or markdown rendering. This ensures AI agents can reliably parse every response.

## Output Convention

All commands output JSON to stdout. On success:

```json
{ "data": <result> }
```

On error:

```json
{ "error": "<error message>" }
```

Exit code 0 on success, 1 on error.

## CLI Discovery

```bash
rss-agg help --json                              # List all available commands as JSON
```

AI agents should call this first to discover all available operations. Output:

```json
{
  "data": {
    "commands": [
      {
        "command": "feed add <url>",
        "options": ["--category <name>"],
        "description": "Add a feed by URL"
      },
      {
        "command": "feed remove <id>",
        "options": [],
        "description": "Remove a feed"
      },
      {
        "command": "feed list",
        "options": ["--category <name>"],
        "description": "List all feeds"
      },
      {
        "command": "feed refresh [id]",
        "options": [],
        "description": "Refresh one or all feeds"
      },
      {
        "command": "entry list",
        "options": ["--feed <id>", "--unread", "--starred", "--limit <n>"],
        "description": "List entries with filters"
      },
      {
        "command": "entry read <id>",
        "options": [],
        "description": "Get entry with full content (HTML)"
      },
      {
        "command": "entry search <keyword>",
        "options": [],
        "description": "Full-text search entries"
      },
      {
        "command": "entry star <id>",
        "options": [],
        "description": "Toggle star on an entry"
      },
      {
        "command": "entry mark-read",
        "options": ["--feed <id>", "--all"],
        "description": "Mark entries as read"
      },
      {
        "command": "ai summarize <entryId>",
        "options": ["--lang <code>"],
        "description": "AI summarize an entry"
      },
      {
        "command": "ai translate <entryId>",
        "options": ["--lang <code>"],
        "description": "AI translate an entry"
      },
      {
        "command": "server start",
        "options": ["--port <number>"],
        "description": "Start API server with scheduler"
      }
    ]
  }
}
```

## Feed Management

```bash
rss-agg feed add <url> [--category <name>]     # Add a feed by URL
rss-agg feed remove <id>                        # Remove a feed
rss-agg feed list [--category <name>]            # List all feeds
rss-agg feed refresh [id]                        # Refresh one or all feeds
```

## Entry Browsing

```bash
rss-agg entry list [--feed <id>] [--unread] [--starred] [--limit 20]
rss-agg entry read <id>                          # Get entry with full content (HTML)
rss-agg entry search <keyword>                   # Full-text search
rss-agg entry star <id>                          # Toggle star
rss-agg entry mark-read [--feed <id>] [--all]    # Mark entries as read
```

## AI Features

```bash
rss-agg ai summarize <entryId> [--lang en]       # Summarize an entry
rss-agg ai translate <entryId> --lang <code>      # Translate an entry
```

## Server

```bash
rss-agg server start [--port 3000]               # Start API server
```
