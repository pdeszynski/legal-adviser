# Development stage - for local development with volume mounts
FROM node:20-alpine AS development

WORKDIR /app

# Install pnpm and NestJS CLI globally
RUN npm install -g pnpm @nestjs/cli

# Copy root package manifests first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy packages (required for pnpm workspace resolution)
# Copy packages before app source code for better layer caching
# The packages directory changes less frequently than app code
COPY packages ./packages

# Copy only app package.json files first (not source code)
# This allows dependency installation to be cached even when source code changes
COPY apps/backend/package.json ./apps/backend/

# Install all dependencies (use no-frozen-lockfile for local dev)
# This layer is cached if manifests and packages/ are unchanged
RUN pnpm install

# Build workspace packages (dependencies for apps)
RUN pnpm run build --filter='./packages/*'

# Copy backend source code AFTER pnpm install (for better caching)
COPY apps/backend ./apps/backend

# Build backend
RUN pnpm run build --filter=@legal/backend

EXPOSE 3001

# For development, run directly with nest CLI from backend directory
# NestJS CLI is installed globally, so it works even with volume mounts
WORKDIR /app/apps/backend
CMD ["nest", "start", "--watch"]

# Build stage - optimized for production builds
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm (system dependency - cached independently)
RUN npm install -g pnpm

# Copy root package manifests first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy packages (required for pnpm workspace resolution)
# Copy packages before app source code for better layer caching
# The packages directory changes less frequently than app code
COPY packages ./packages

# Copy only app package.json files first (not source code)
# This allows dependency installation to be cached even when source code changes
COPY apps/backend/package.json ./apps/backend/

# Install all dependencies (cached if manifests unchanged)
RUN pnpm install

# Build workspace packages (dependencies for apps)
RUN pnpm run build --filter='./packages/*'

# Copy backend source code AFTER pnpm install (for better caching)
COPY apps/backend ./apps/backend

# Build backend
RUN pnpm run build --filter=@legal/backend

# Production stage - optimized for production deployments
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root manifests first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace files needed for production dependency resolution
# Copy packages before app code for better cache invalidation
COPY packages ./packages
COPY apps/backend/package.json ./apps/backend/

# Install production dependencies only
# This layer is cached if manifests and packages/ are unchanged
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
