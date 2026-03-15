# RSS Aggregator — Claude Code Guide

## 1. Environment

DevContainer (Ubuntu 22.04 + CUDA 12.4), Node.js 22.x, gh CLI pre-installed.

**Installed:**

- pnpm 10.32.1
- Turborepo 2.8.17
- TypeScript 5.9.3

> Update this section as the environment evolves.

## 2. Development Status

See `docs_for_ai/development-plan.md` for full details of each phase.

| Phase | Name                     | Status   |
| ----- | ------------------------ | -------- |
| 0     | Project Scaffolding      | Complete |
| 1     | Core — Database & Models | Complete |
| 2     | Core — RSS Fetching      | Complete |
| 3     | API Server               | Complete |
| 4     | AI Features              | Complete |
| 5     | CLI Tool                 | Complete |
| 6     | Web Frontend             | Complete |

**All phases complete.**

> Update this table as each phase is completed.

## 3. Project Documentation

Documentation directory: `docs_for_ai/`

- `project-architecture.md` — overview, tech stack, directory structure, coding conventions, logging, environment variables
- `data-and-api-design.md` — database schema, API endpoints, API help endpoint, AI integration design
- `cli-design.md` — CLI commands, JSON output convention, CLI help command
- `web-ui-design.md` — pages, routes, component tree, state management, responsive layout, error handling
- `development-plan.md` — phased implementation plan (Phase 0–6) with tasks and verification criteria

## 4. AI Workflow Rules

- Before starting any task, read `docs_for_ai/development-plan.md` to understand current phase and task context
- Then read the relevant document(s) as needed:
  - Project structure / conventions / env vars → `project-architecture.md`
  - Database / API / AI work → `data-and-api-design.md`
  - CLI work → `cli-design.md`
  - Frontend work → `web-ui-design.md`
- Follow the phase order in `development-plan.md` — each phase depends on the previous one
- All CLI output must be JSON (CLI is for AI agents, not humans)
- All API content fields return raw HTML (frontend handles rendering and sanitization)
- Use OpenAI-compatible format (`openai` npm package) for AI calls — not Anthropic SDK

## 5. Publishing to GitHub Packages

Packages are published to GitHub Packages under the `@wzxklm` scope. A GitHub Actions workflow (`.github/workflows/publish.yml`) auto-publishes when a `v*` tag is pushed.

**Packages:**

- `@wzxklm/rss-agg-core` — core library (`packages/core`)
- `@wzxklm/rss-agg` — CLI tool (`apps/cli`)

**To release a new version:**

1. Bump `version` in the relevant `package.json` (core, cli, or both)
   - If core changed, bump `packages/core/package.json` first
   - If cli changed, bump `apps/cli/package.json`
   - If both changed, bump both
2. Commit and push to `main`
3. Create and push a tag: `git tag v<version> && git push origin v<version>`
4. GitHub Actions will auto-build and publish

**Version convention:** follow semver — `patch` for bug fixes, `minor` for new features, `major` for breaking changes.
