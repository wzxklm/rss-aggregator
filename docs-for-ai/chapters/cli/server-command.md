# Server Command — spawn API server as child process

## Overview

Registers the `server start` command that launches the API server (`apps/api/dist/index.js`) as a child process. Verifies the build artifact exists before spawning, and forwards the optional `--port` flag via the `API_PORT` environment variable.

## Key Behaviors

- **Build check**: Uses `accessSync(apiEntry)` to verify `apps/api/dist/index.js` exists; calls `fail()` with build instructions if missing
- **Path resolution**: Computes API entry path relative to the CLI's compiled output: `resolve(__dirname, "../../../api/dist/index.js")`
- **Port forwarding**: If `--port` is provided, sets `API_PORT` in the child's env (copies full parent env first)
- **stdio inherit**: Child process inherits parent stdio (`stdio: "inherit"`) — server output goes directly to the terminal
- **Process lifecycle**: Listens for `error` (spawn failure) and `exit` (propagates exit code, defaults to 1)

## Interface

`registerServerCommand(program: Command) → void`

### Commands

| Command | Args | Options | Description |
|---------|------|---------|-------------|
| `server start` | — | `--port <number>` | Start the API server with optional port override |

## Internal Details

Uses `__dirname` derived from `import.meta.url` via `fileURLToPath` / `dirname` (ESM pattern). The API entry path assumes standard monorepo build output layout: `apps/cli/dist/commands/server.js` resolves `../../../api/dist/index.js` to `apps/api/dist/index.js`.

Does not call `initDb()` — the API server handles its own database initialization.

Does not use `success()` — the server runs indefinitely; exit is handled by propagating the child's exit code.

## Dependencies

- Uses: `child_process.spawn`, `fs.accessSync`, `path.resolve`, `fail` (from `../output.js`)
- Used by: Main Entry (`index.ts`)
