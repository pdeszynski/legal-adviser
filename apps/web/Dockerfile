# Build stage - optimized for layer caching
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm (system dependency - cached independently)
RUN npm install -g pnpm

# Copy root package manifests first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy workspace directories (required for pnpm workspace resolution)
# The .dockerignore excludes node_modules and build artifacts
COPY packages ./packages
COPY apps/web ./apps/web
COPY apps/ai-engine ./apps/ai-engine
COPY apps/backend ./apps/backend

# Install all dependencies (cached if manifests unchanged)
RUN pnpm install --frozen-lockfile

# Build workspace packages (dependencies for apps)
RUN pnpm run build --filter='./packages/*'

# Build web (skip ESLint for Docker builds)
RUN export NEXT_ESLINT_IGNORE_DURING_BUILDS=true && pnpm run build --filter=@legal/web

# Production stage - optimized for layer caching
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root manifests first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace directories
COPY packages ./packages
COPY apps/web ./apps/web
COPY apps/ai-engine ./apps/ai-engine
COPY apps/backend ./apps/backend

# Install production dependencies only (skip scripts to avoid prepare failing)
# This layer is cached if manifests unchanged
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy built web from builder
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/next.config.mjs ./apps/web/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

USER nextjs

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["node", "node_modules/refine/dist/bin.js", "start"]
