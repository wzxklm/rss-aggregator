import type { Command } from "commander";
import { entryService } from "@rss-agg/core";
import { initDb, success, fail } from "../output.js";

export function registerEntryCommands(program: Command): void {
  const entry = program.command("entry");

  entry
    .command("list")
    .option("--feed <id>", "Filter by feed ID")
    .option("--unread", "Show only unread entries")
    .option("--starred", "Show only starred entries")
    .option("--limit <n>", "Max entries to return", "50")
    .action(
      (opts: {
        feed?: string;
        unread?: boolean;
        starred?: boolean;
        limit: string;
      }) => {
        initDb();
        const result = entryService.listEntries({
          feedId: opts.feed,
          unread: opts.unread,
          starred: opts.starred,
          limit: parseInt(opts.limit, 10),
        });
        if (result.error) fail(result.error);
        success(result.data);
      },
    );

  entry
    .command("read")
    .argument("<id>", "Entry ID")
    .action((id: string) => {
      initDb();
      const result = entryService.getEntryById(id);
      if (result.error) fail(result.error);
      // Mark as read and return updated entry
      if (!result.data!.readAt) {
        const updated = entryService.markRead(id);
        if (updated.data) {
          success(updated.data);
          return;
        }
      }
      success(result.data);
    });

  entry
    .command("search")
    .argument("<keyword>", "Search keyword")
    .action((keyword: string) => {
      initDb();
      const result = entryService.listEntries({ search: keyword });
      if (result.error) fail(result.error);
      success(result.data);
    });

  entry
    .command("star")
    .argument("<id>", "Entry ID")
    .action((id: string) => {
      initDb();
      const current = entryService.getEntryById(id);
      if (current.error) fail(current.error);
      const newStarred = current.data!.starred === 1 ? 0 : 1;
      const result = entryService.updateEntry(id, { starred: newStarred });
      if (result.error) fail(result.error);
      success(result.data);
    });

  entry
    .command("mark-read")
    .option("--feed <id>", "Mark all entries for a feed as read")
    .option("--all", "Mark all entries as read")
    .action((opts: { feed?: string; all?: boolean }) => {
      initDb();
      if (!opts.feed && !opts.all) {
        fail("Provide --feed <id> or --all");
      }
      const result = entryService.markAllRead({
        feedId: opts.feed,
      });
      if (result.error) fail(result.error);
      success(result.data);
    });
}
