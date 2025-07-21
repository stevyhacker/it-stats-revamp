FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/db ./packages/db
COPY apps/api ./apps/api

# Build the database package first
WORKDIR /usr/src/app/packages/db
RUN bun run build || true

# Build the API
WORKDIR /usr/src/app/apps/api
RUN bun run build

# Expose port
EXPOSE 3004

# Set environment
ENV NODE_ENV=production

# Start the server
CMD ["bun", "start"] 