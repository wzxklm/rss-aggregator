import cron, { type ScheduledTask } from "node-cron";
import { logger } from "../logger.js";
import { refreshAllFeeds } from "./feed.js";

let task: ScheduledTask | null = null;

export function startScheduler(interval?: string): void {
  if (task) {
    logger.warn("Scheduler already running, stopping previous instance");
    task.stop();
  }

  const cronExpression = interval ?? process.env["CRON_INTERVAL"] ?? "*/30 * * * *";

  if (!cron.validate(cronExpression)) {
    logger.error({ cronExpression }, "Invalid cron expression");
    return;
  }

  task = cron.schedule(cronExpression, async () => {
    logger.info("Scheduled feed refresh starting");
    await refreshAllFeeds();
  });

  logger.info({ cronExpression }, `Cron started: refresh all feeds on schedule "${cronExpression}"`);
}

export function stopScheduler(): void {
  if (task) {
    task.stop();
    task = null;
    logger.info("Cron stopped");
  }
}
