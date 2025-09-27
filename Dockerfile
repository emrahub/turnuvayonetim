# Production Dockerfile for Turnuva Yönetim System
# Multi-stage build with Node.js 20 Alpine, security best practices, and health checks

# Build stage for dependencies
FROM node:20.9.0-alpine AS deps
WORKDIR /app

# Add labels for metadata
LABEL maintainer="DevOps Team"
LABEL version="1.0.0"
LABEL description="Poker Tournament Management System"

# Security: Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs --ingroup nodejs

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    libc6-compat \
    dumb-init \
    curl && \
    rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/web/package*.json ./apps/web/
COPY apps/ws/package*.json ./apps/ws/
COPY apps/cli/package*.json ./apps/cli/ 2>/dev/null || true
COPY packages/*/package*.json ./packages/*/

# Install dependencies with clean cache
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Build stage
FROM node:20.9.0-alpine AS builder
WORKDIR /app

# Security: Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs --ingroup nodejs

# Install build dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat && \
    rm -rf /var/cache/apk/*

# Copy source code
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Generate Prisma client
RUN cd apps/backend && npx prisma generate

# Build all applications
RUN npm run build

# Production stage for Backend
FROM node:20.9.0-alpine AS backend-prod
WORKDIR /app

# Security: Install dumb-init and create non-root user
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl && \
    rm -rf /var/cache/apk/* && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 backend --ingroup nodejs

# Copy built backend application
COPY --from=builder --chown=backend:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=backend:nodejs /app/apps/backend/package*.json ./apps/backend/
COPY --from=builder --chown=backend:nodejs /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=deps --chown=backend:nodejs /app/node_modules ./node_modules

# Security: Set proper permissions
RUN chmod -R 755 /app && \
    chown -R backend:nodejs /app

# Switch to non-root user
USER backend

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/backend/dist/index.js"]

# Production stage for Frontend (Next.js)
FROM node:20.9.0-alpine AS frontend-prod
WORKDIR /app

# Security: Install dumb-init and create non-root user
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl && \
    rm -rf /var/cache/apk/* && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs --ingroup nodejs

# Copy built frontend application
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Security: Set proper permissions
RUN chmod -R 755 /app && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3005/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/web/server.js"]

# Production stage for WebSocket Server
FROM node:20.9.0-alpine AS ws-prod
WORKDIR /app

# Security: Install dumb-init and create non-root user
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl && \
    rm -rf /var/cache/apk/* && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 wsuser --ingroup nodejs

# Copy built WebSocket application
COPY --from=builder --chown=wsuser:nodejs /app/apps/ws/dist ./apps/ws/dist
COPY --from=builder --chown=wsuser:nodejs /app/apps/ws/package*.json ./apps/ws/
COPY --from=deps --chown=wsuser:nodejs /app/node_modules ./node_modules

# Security: Set proper permissions
RUN chmod -R 755 /app && \
    chown -R wsuser:nodejs /app

# Switch to non-root user
USER wsuser

# Expose port
EXPOSE 3003

# Health check for WebSocket (using HTTP endpoint if available)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3003/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/ws/dist/index.js"]