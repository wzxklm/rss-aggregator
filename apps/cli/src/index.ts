#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// Load config from ~/.config/rss-agg/.env (only sets vars not already in env)
const configPath = join(homedir(), ".config", "rss-agg", ".env");
if (existsSync(configPath)) {
  const lines = readFileSync(configPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

// Suppress pino logs to stdout — CLI output must be JSON only.
// Must be set before any @wzxklm/rss-agg-core modules are imported (pino reads env at init).
process.env["LOG_LEVEL"] = "silent";

async function main() {
  const { Command } = await import("commander");
  const { registerFeedCommands } = await import("./commands/feed.js");
  const { registerEntryCommands } = await import("./commands/entry.js");
  const { registerAiCommands } = await import("./commands/ai.js");
  const { registerServerCommand } = await import("./commands/server.js");
  const { success } = await import("./output.js");

  const program = new Command();

  program
    .name("rss-agg")
    .description("RSS Aggregator CLI — designed for AI agents")
    .version("0.0.1");

  // Disable default help command so we can provide our own JSON help
  program.addHelpCommand(false);
  program.helpOption(false);

  // help --json: structured JSON listing of all commands
  program
    .command("help")
    .option("--json", "Output help as JSON")
    .action((opts: { json?: boolean }) => {
      if (opts.json) {
        success({
          commands: [
            {
              command: "feed add <url>",
              options: ["--category <name>"],
              description: "Add a feed by URL",
            },
            {
              command: "feed remove <id>",
              options: [],
              description: "Remove a feed",
            },
            {
              command: "feed list",
              options: ["--category <name>"],
              description: "List all feeds",
            },
            {
              command: "feed refresh [id]",
              options: [],
              description: "Refresh one or all feeds",
            },
            {
              command: "entry list",
              options: [
                "--feed <id>",
                "--category <id>",
                "--unread",
                "--starred",
                "--limit <n>",
              ],
              description: "List entries with filters",
            },
            {
              command: "entry read <id>",
              options: [],
              description: "Get entry with full content (HTML)",
            },
            {
              command: "entry search <keyword>",
              options: [],
              description: "Full-text search entries",
            },
            {
              command: "entry star <id>",
              options: [],
              description: "Toggle star on an entry",
            },
            {
              command: "entry mark-read",
              options: ["--feed <id>", "--all"],
              description: "Mark entries as read",
            },
            {
              command: "ai summarize <entryId>",
              options: ["--lang <code>"],
              description: "AI summarize an entry",
            },
            {
              command: "ai translate <entryId>",
              options: ["--lang <code>"],
              description: "AI translate an entry",
            },
            {
              command: "server start",
              options: ["--port <number>"],
              description: "Start API server with scheduler",
            },
          ],
        });
      }
    });

  registerFeedCommands(program);
  registerEntryCommands(program);
  registerAiCommands(program);
  registerServerCommand(program);

  await program.parseAsync(process.argv);
}

main();
