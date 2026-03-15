import type { Command } from "commander";
import { feedService, categoryService } from "@wzxklm/rss-agg-core";
import { initDb, success, fail } from "../output.js";

function resolveCategoryId(name: string): string | undefined {
  const result = categoryService.getAllCategories();
  if (result.error || !result.data) return undefined;
  const match = result.data.find(
    (c) => c.name.toLowerCase() === name.toLowerCase(),
  );
  return match?.id;
}

export function registerFeedCommands(program: Command): void {
  const feed = program.command("feed");

  feed
    .command("add")
    .argument("<url>", "Feed URL")
    .option("--category <name>", "Category name")
    .action(async (url: string, opts: { category?: string }) => {
      initDb();
      let categoryId: string | undefined;
      if (opts.category) {
        categoryId = resolveCategoryId(opts.category);
        if (!categoryId) {
          fail(`Category not found: ${opts.category}`);
        }
      }
      const result = await feedService.addFeed({ url, categoryId });
      if (result.error) fail(result.error);
      success(result.data);
    });

  feed
    .command("remove")
    .argument("<id>", "Feed ID")
    .action((id: string) => {
      initDb();
      const result = feedService.deleteFeed(id);
      if (result.error) fail(result.error);
      success(result.data);
    });

  feed
    .command("list")
    .option("--category <name>", "Filter by category name")
    .action((opts: { category?: string }) => {
      initDb();
      let categoryId: string | undefined;
      if (opts.category) {
        categoryId = resolveCategoryId(opts.category);
        if (!categoryId) {
          fail(`Category not found: ${opts.category}`);
        }
      }
      const result = feedService.getAllFeeds(categoryId);
      if (result.error) fail(result.error);
      success(result.data);
    });

  feed
    .command("refresh")
    .argument("[id]", "Feed ID (omit to refresh all)")
    .action(async (id?: string) => {
      initDb();
      if (id) {
        const result = await feedService.refreshFeed(id);
        if (result.error) fail(result.error);
        success(result.data);
      } else {
        const result = await feedService.refreshAllFeeds();
        if (result.error) fail(result.error);
        success(result.data);
      }
    });
}
