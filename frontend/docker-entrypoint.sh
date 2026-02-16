#!/bin/sh
# Docker entrypoint script for HyFern frontend
# Handles database initialization and admin user creation

set -e

echo "🚀 Starting HyFern Frontend..."

# Wait for database to be ready (SQLite file check)
echo "⏳ Waiting for database to be ready..."
DATABASE_PATH="/app/prisma/hyfern.db"

# If DATABASE_URL is file:path, extract the path
if [ -n "$DATABASE_URL" ]; then
    case "$DATABASE_URL" in
        file:*)
            DATABASE_PATH="${DATABASE_URL#file:}"
            ;;
    esac
fi

# Wait for database file to exist
until [ -f "$DATABASE_PATH" ] || [ -f "/app/prisma/hyfern.db" ]; do
    echo "   Database file not found, retrying in 2 seconds..."
    sleep 2
done

# Run Prisma migrate/generate if needed
echo "🔧 Setting up database..."
cd /app
npx prisma migrate deploy || npx prisma db push || true

# Check if admin user needs to be initialized
echo "🔧 Checking for admin user..."
if [ -f "/app/scripts/init-admin.mjs" ]; then
    echo "📝 Running admin initialization..."
    node /app/scripts/init-admin.mjs || echo "⚠️  Admin init failed (user might already exist)"
else
    echo "⚠️  Admin init script not found, skipping..."
fi

echo "🎯 Starting Next.js server..."
exec node server.js
