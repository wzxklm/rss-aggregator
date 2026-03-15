import type { Command } from "commander";
import { aiService } from "@rss-agg/core";
import { initDb, success, fail } from "../output.js";

export function registerAiCommands(program: Command): void {
  const ai = program.command("ai");

  ai.command("summarize")
    .argument("<entryId>", "Entry ID to summarize")
    .option("--lang <code>", "Language code", "en")
    .action(async (entryId: string, opts: { lang: string }) => {
      initDb();
      const result = await aiService.summarizeEntry(entryId, opts.lang);
      if (result.error) fail(result.error);
      success(result.data);
    });

  ai.command("translate")
    .argument("<entryId>", "Entry ID to translate")
    .option("--lang <code>", "Target language code", "en")
    .action(async (entryId: string, opts: { lang: string }) => {
      initDb();
      const result = await aiService.translateEntry(entryId, opts.lang);
      if (result.error) fail(result.error);
      success(result.data);
    });
}
