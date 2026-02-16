# HyFern Frontend Dockerfile
# Optimized multi-stage build for Next.js 16 application

# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Install libc6-compat for compatibility (sometimes needed for Prisma)
RUN apk add --no-cache libc6-compat

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

# Install dev dependencies separately for Prisma generation
RUN npm ci --only=dev --ignore-scripts

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Install libc6-compat for Prisma
RUN apk add --no-cache libc6-compat

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Stage 3: Runner (optimized minimal image)
FROM node:22-alpine AS runner
WORKDIR /app

# Install runtime dependencies (Prisma needs openssl, better-sqlite3 needs build tools)
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

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

# Note: standalone build already copied node_modules to /app/node_modules
# We just need to add the two extra dependencies for the init script
RUN cd /app && npm install --omit=dev --no-save --no-audit --no-fund better-sqlite3@11.7.0 bcryptjs@2.4.3 && \
    npm cache clean --force

# Create uploads directory for profile pictures
RUN mkdir -p /app/public/uploads/avatars && \
    chown -R nextjs:nodejs /app/public/uploads

# Copy entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

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
