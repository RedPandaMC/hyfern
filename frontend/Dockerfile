# HyFern Frontend Dockerfile
# Optimized multi-stage build for Next.js 16 application

# Stage 1: Dependencies
FROM node:22.22.0-slim AS deps
WORKDIR /app

# Set HOME and npm cache for permission fixes
ENV HOME=/app
ENV NPM_CONFIG_CACHE=/app/.npm

# Install all dependencies (including dev for Prisma and Tailwind)
COPY package.json package-lock.json* ./
RUN npm ci --include=dev

# Stage 2: Builder
FROM node:22.22.0-slim AS builder
WORKDIR /app

# Set environment variables
ENV HOME=/app
ENV NPM_CONFIG_CACHE=/app/.npm
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set DATABASE_URL for Prisma (required during build)
ENV DATABASE_URL="file:./dev.db"

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Stage 3: Runner (optimized minimal image with security)
FROM node:22.22.0-slim AS runner
WORKDIR /app

# Set environment variables
ENV HOME=/app
ENV NPM_CONFIG_CACHE=/app/.npm
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install runtime dependencies including build tools for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    python3 \
    make \
    g++ \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder with correct ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma client (generated into app/generated/prisma/)
COPY --from=builder --chown=nextjs:nodejs /app/app/generated/prisma ./app/generated/prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma/schema.prisma ./prisma/schema.prisma

# Copy admin initialization script (.mjs — runs with plain node, no tsx needed)
COPY --from=builder --chown=nextjs:nodejs /app/scripts/init-admin.mjs ./scripts/init-admin.mjs

# Install runtime dependencies with native module build
# This rebuilds better-sqlite3 for the target platform
RUN cd /app && npm install --omit=dev --no-save --no-audit --no-fund \
    better-sqlite3@11.7.0 \
    bcryptjs@2.4.3 \
    @prisma/adapter-better-sqlite3@7.3.0 \
    && npm cache clean --force

# Create uploads directory for profile pictures (read-write required)
RUN mkdir -p /app/public/uploads/avatars && \
    chown -R nextjs:nodejs /app/public/uploads

# Copy entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Create tmp directory for Next.js cache (read-write required)
RUN mkdir -p /app/.next/cache /tmp && \
    chown -R nextjs:nodejs /app/.next /tmp

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set port environment variable
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application via entrypoint script
ENTRYPOINT ["/app/docker-entrypoint.sh"]
