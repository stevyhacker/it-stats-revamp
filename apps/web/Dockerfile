# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy all packages and apps
COPY packages ./packages
COPY apps ./apps

# Install ALL dependencies
RUN pnpm install --frozen-lockfile

# Build web app and its dependencies
RUN pnpm run --filter web build

# Production stage
FROM node:20-alpine AS production

# Install pnpm for runtime
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/apps/web/package.json ./
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/next.config.mjs ./

# Copy node_modules from builder (includes workspace dependencies)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Set production environment
ENV NODE_ENV=production

# Next.js collects anonymous telemetry data about general usage
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Set PORT environment variable for Railway
ENV PORT=3000

# Start Next.js in production mode
CMD ["pnpm", "start"] 