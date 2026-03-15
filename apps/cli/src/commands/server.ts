import { spawn } from "node:child_process";
import { accessSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Command } from "commander";
import { fail } from "../output.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function registerServerCommand(program: Command): void {
  const server = program.command("server");

  server
    .command("start")
    .option("--port <number>", "Server port")
    .action((opts: { port?: string }) => {
      const apiEntry = resolve(__dirname, "../../../api/dist/index.js");

      try {
        accessSync(apiEntry);
      } catch {
        fail("API server not built. Run 'pnpm run build' first.");
      }

      const env = { ...process.env };
      if (opts.port) env["API_PORT"] = opts.port;

      const child = spawn(process.execPath, [apiEntry], {
        stdio: "inherit",
        env,
      });

      child.on("error", (err) => {
        fail(`Failed to start server: ${err.message}`);
      });

      child.on("exit", (code) => {
        process.exit(code ?? 1);
      });
    });
}
