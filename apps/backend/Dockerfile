# Development stage - for local development with volume mounts
FROM node:20-alpine AS development

WORKDIR /app

# Install pnpm
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

# Install all dependencies (use no-frozen-lockfile for local dev)
RUN pnpm install

# Build workspace packages (dependencies for apps)
RUN pnpm run build --filter='./packages/*'

# Build backend
RUN pnpm run build --filter=@legal/backend

EXPOSE 3001

# For development, run directly with nest CLI from backend directory
# This avoids turbo which is in root node_modules (overridden by volume mount)
WORKDIR /app/apps/backend
CMD ["npx", "@nestjs/cli", "start", "--watch"]

# Build stage - optimized for production builds
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
RUN pnpm install

# Build workspace packages (dependencies for apps)
RUN pnpm run build --filter='./packages/*'

# Build backend
RUN pnpm run build --filter=@legal/backend

# Production stage - optimized for production deployments
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root manifests first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace directories (needed for production dependencies and node_modules resolution)
COPY packages ./packages
COPY apps/web ./apps/web
COPY apps/ai-engine ./apps/ai-engine
COPY apps/backend ./apps/backend

# Install production dependencies only
# This layer is cached if manifests unchanged
RUN pnpm install --prod

# Copy built artifacts from builder stage
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages ./packages

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

USER nestjs

EXPOSE 3001

CMD ["node", "apps/backend/dist/main.js"]
