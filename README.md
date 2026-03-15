# RSS Aggregator

An RSS aggregator with AI-powered summarization and translation. Provides both a Web UI and a CLI designed for AI agents.

## Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Backend**: Hono + better-sqlite3 + Drizzle ORM
- **Frontend**: React + Tailwind CSS + shadcn/ui
- **CLI**: Commander.js (JSON output, built for AI agents)
- **AI**: OpenAI-compatible API

## Environment Variables

```bash
cp .env.example .env
```

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_PATH` | SQLite database file path | Yes |
| `AUTH_PASSWORD` | Login password | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `AI_BASE_URL` | OpenAI-compatible API base URL | No (defaults to OpenAI) |
| `AI_API_KEY` | AI provider API key | Required for AI features |
| `AI_MODEL` | AI model name | No (defaults to gpt-4o-mini) |
| `APP_PORT` | Docker exposed port | No (defaults to 8765) |
| `LOG_LEVEL` | Log level (debug/info/warn/error) | No (defaults to info) |
| `CRON_INTERVAL` | RSS fetch cron expression | No (defaults to every 30 min) |

## Install via GitHub Packages

The CLI tool is published to GitHub Packages as `@wzxklm/rss-agg`.

```bash
# 1. Configure npm registry (one-time)
echo "@wzxklm:registry=https://npm.pkg.github.com" >> ~/.npmrc

# 2. Install globally
npm install -g @wzxklm/rss-agg

# 3. Create config file
mkdir -p ~/.config/rss-agg
cat > ~/.config/rss-agg/.env << 'EOF'
DATABASE_PATH=~/.config/rss-agg/data.db
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-your-api-key
AI_MODEL=gpt-4o-mini
EOF

# 4. Use the CLI
rss-agg feed list
rss-agg feed add https://example.com/rss.xml
rss-agg entry list --limit 10
rss-agg ai summarize <entryId>
```

Or run directly with npx (config file still applies):

```bash
npx @wzxklm/rss-agg feed list
```

### CLI Configuration

The CLI reads `~/.config/rss-agg/.env` on startup. Environment variables set in your shell take precedence over the config file.

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_PATH` | SQLite database file path | Yes |
| `AI_BASE_URL` | OpenAI-compatible API base URL | No (defaults to OpenAI) |
| `AI_API_KEY` | AI provider API key | Required for AI features |
| `AI_MODEL` | AI model name | No (defaults to gpt-4o-mini) |

> The CLI operates directly on a local SQLite database and outputs JSON, designed for AI agents.

## Deployment

### Option 1: Docker (Recommended)

Prerequisites: Docker and Docker Compose.

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env — set AUTH_PASSWORD, JWT_SECRET, etc.

# 2. Build and start
docker compose up -d

# 3. View logs
docker compose logs -f

# 4. Stop
docker compose down
```

Visit `http://<server-ip>:<APP_PORT>` to access the Web UI.

Data is persisted in the `rss-data` Docker volume.

**Using CLI inside the container:**

```bash
docker compose exec app node apps/cli/dist/index.js help --json
docker compose exec app node apps/cli/dist/index.js feed list
```

### Option 2: Manual Deployment

Prerequisites: Node.js 22+, pnpm.

```bash
# 1. Install dependencies and build
pnpm install
pnpm build

# 2. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_PATH to a local path, e.g. ./data/rss-agg.db

# 3. Start the API server (also serves the Web frontend)
node apps/api/dist/index.js
```

Visit `http://<server-ip>:3000` to access the Web UI (port controlled by `API_PORT` in `.env`, defaults to 3000).

Use pm2 or systemd for process management:

```bash
# pm2
pm2 start apps/api/dist/index.js --name rss-agg

# systemd
# Create /etc/systemd/system/rss-agg.service, then:
systemctl enable --now rss-agg
```

### CLI Usage

The CLI operates directly on the database — it does not depend on the API server. All output is JSON, designed for AI agents.

```bash
# Help
node apps/cli/dist/index.js help --json

# Feed management
node apps/cli/dist/index.js feed add <url>
node apps/cli/dist/index.js feed list
node apps/cli/dist/index.js feed remove <id>
node apps/cli/dist/index.js feed refresh

# Entries
node apps/cli/dist/index.js entry list --limit 10
node apps/cli/dist/index.js entry read <id>
node apps/cli/dist/index.js entry search <keyword>

# AI features
node apps/cli/dist/index.js ai summarize <entryId>
node apps/cli/dist/index.js ai translate <entryId> --lang zh
```
