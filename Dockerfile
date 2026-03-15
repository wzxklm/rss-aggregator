# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

WORKDIR /app

# Install dependencies first (cache layer)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/core/package.json packages/core/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile

# Copy source and build
COPY turbo.json tsconfig.base.json ./
COPY packages/core/ packages/core/
COPY apps/api/ apps/api/
COPY apps/web/ apps/web/

RUN pnpm run build

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:22-alpine

# better-sqlite3 requires native compilation
RUN apk add --no-cache python3 make g++

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

WORKDIR /app

# Copy workspace config
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/core/package.json packages/core/
COPY apps/api/package.json apps/api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Remove build tools to reduce image size
RUN apk del python3 make g++

# Copy built output
COPY --from=build /app/packages/core/dist/ packages/core/dist/
COPY --from=build /app/apps/api/dist/ apps/api/dist/
COPY --from=build /app/apps/web/dist/ apps/web/dist/

# Copy drizzle migrations (needed at runtime)
COPY packages/core/drizzle/ packages/core/drizzle/

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "apps/api/dist/index.js"]
