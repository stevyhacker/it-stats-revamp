# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

# Install bun
RUN apk add --no-cache bash curl && \
    curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy all packages and apps
COPY packages ./packages
COPY apps ./apps

# Install ALL dependencies (needed for building)
RUN pnpm install --frozen-lockfile

# Build the API and its dependencies
RUN pnpm run --filter api build

# Production stage
FROM node:20-alpine AS production

# Install bun for runtime
RUN apk add --no-cache bash curl && \
    curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

WORKDIR /app

# Copy built application
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./

# Copy production dependencies from builder
# We need to copy the entire node_modules because of workspace dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Use bun to run the application
CMD ["bun", "run", "dist/index.js"]
