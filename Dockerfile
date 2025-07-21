# 1. Base image
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install bun
RUN apt-get update -y && apt-get install -y curl unzip
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"


# 2. Builder stage
FROM base AS builder
WORKDIR /app

# Copy all package manifests and lockfile first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Now copy the rest of the source code
COPY . .

# Build all apps
RUN pnpm turbo build --filter=web --filter=api

# Prune dev dependencies
RUN pnpm prune --prod


# 3. Production image
FROM base AS production
WORKDIR /app

# Copy the pruned dependencies and the built source code from the builder stage
COPY --from=builder /app .

# Expose port for the service. Railway will map this to 80/443.
EXPOSE 3000

# Default command, will be overridden by railway.json
CMD ["pnpm", "--filter", "web", "start"]