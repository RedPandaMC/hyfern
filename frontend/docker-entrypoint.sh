#!/bin/sh
# Docker entrypoint script for HyFern frontend
# Handles database initialization and admin user creation

set -e

echo "🚀 Starting HyFern Frontend..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => client.end())
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
" 2>/dev/null; do
  echo "   Database not ready, retrying in 2 seconds..."
  sleep 2
done

echo "✅ Database is ready!"

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
