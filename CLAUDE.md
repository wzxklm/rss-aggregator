# RSS Aggregator — Claude Code Guide

## 1. Environment

DevContainer (Ubuntu 22.04 + CUDA 12.4), Node.js 22.x, gh CLI pre-installed.

## 2. Development Status

## 3. Project Documentation

Documentation directory: `docs-for-ai/`

- `index.md` — project index: metadata, directory tree, architecture diagram, dependency map, chapter listing
- `pitfalls.md` — pitfalls & conventions grouped by domain, must-read before coding
- `chapters/core/` — core library: database, services (feed, entry, category, AI, scheduler), infrastructure
- `chapters/api/` — API server: app init, auth, route modules (feed, entry, category, AI, help)
- `chapters/cli/` — CLI tool: entry point, command groups (feed, entry, AI, server), output handler
- `chapters/web/` — web frontend: routing/state, pages, layout, UI components
- `chapters/workflows.md` — end-to-end workflows with pseudocode flowcharts

## 4. AI Workflow Rules

- When launching subagents via the Agent tool, instruct them to read `CLAUDE.md` first before performing any work
- Before starting any task, read `docs-for-ai/index.md` for project overview and `docs-for-ai/pitfalls.md` for conventions
- Then read the relevant chapter(s) as needed:
  - Database / services / types → `chapters/core/`
  - API routes / auth / middleware → `chapters/api/`
  - CLI commands / output → `chapters/cli/`
  - Frontend pages / components / hooks → `chapters/web/`
  - Cross-component tasks → `chapters/workflows.md`

## 5. Publishing to GitHub Packages

Packages are published to GitHub Packages under the `@wzxklm` scope. A GitHub Actions workflow (`.github/workflows/publish.yml`) auto-publishes when a `v*` tag is pushed.

**Packages:**

- `@wzxklm/rss-agg-core` — core library (`packages/core`)
- `@wzxklm/rss-agg` — CLI tool (`apps/cli`)

**To release a new version:**

1. Bump `version` in the relevant `package.json`
   - If core changed, bump both `packages/core/package.json` and `apps/cli/package.json` (cli depends on core)
   - If only cli changed, bump `apps/cli/package.json` only
2. Commit and push to `main`
3. Create and push a tag: `git tag v<version> && git push origin v<version>`
4. GitHub Actions will auto-build and publish

**Version convention:** follow semver — `patch` for bug fixes, `minor` for new features, `major` for breaking changes.
