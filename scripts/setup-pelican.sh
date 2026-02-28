#!/bin/sh
set -e

echo "=========================================="
echo "Pelican Panel Auto-Configuration Script"
echo "=========================================="

# Wait for Pelican to be fully ready
sleep 5

cd /var/www/html

# Check if already installed
if grep -q "APP_INSTALLED=true" .env 2>/dev/null; then
    echo "Pelican is already configured"
    exit 0
fi

echo "Setting up Pelican environment..."

# Create/update environment configuration
if [ ! -f "/pelican-data/.env" ]; then
    echo "Creating .env file..."
    cat > /pelican-data/.env << EOF
APP_KEY=${PELICAN_APP_KEY}
APP_ENV=production
APP_DEBUG=false
APP_URL=${PELICAN_APP_URL}
APP_INSTALLED=false

DB_CONNECTION=sqlite
DB_DATABASE=/var/www/html/database/database.sqlite

CACHE_STORE=redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

MAIL_DRIVER=log
MAIL_FROM_ADDRESS=noreply@hyfern.us
MAIL_FROM_NAME=HyFern Panel

SESSION_DRIVER=redis
SESSION_LIFETIME=120

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
EOF
    
    # Create symlink
    ln -sf /pelican-data/.env /var/www/html/.env
    chown www-data:www-data /pelican-data/.env
    chmod 640 /pelican-data/.env
fi

# Wait for database to be ready
echo "Waiting for database..."
sleep 3

# Run migrations
echo "Running database migrations..."
php artisan migrate --force --no-interaction

# Generate key if not exists
if ! grep -q "APP_KEY=base64:" /pelican-data/.env 2>/dev/null; then
    echo "Generating application key..."
    php artisan key:generate --force
fi

# Create admin user
echo "Creating admin user..."
ADMIN_PASSWORD=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9!@#$%^&*' | fold -w 20 | head -n 1)

php artisan make:filament-user \
    --name="Administrator" \
    --email="hyfern-admin@hyfern.us" \
    --password="${ADMIN_PASSWORD}" \
    --no-interaction || true

# Mark as installed
sed -i 's/APP_INSTALLED=false/APP_INSTALLED=true/' /pelican-data/.env

echo ""
echo "=========================================="
echo "PANEL ADMIN CREDENTIALS"
echo "=========================================="
echo "Email: hyfern-admin@hyfern.us"
echo "Password: ${ADMIN_PASSWORD}"
echo "=========================================="
echo ""

# Save credentials
echo "Pelican Admin Credentials" > /data/pelican-admin-credentials.txt
echo "Email: hyfern-admin@hyfern.us" >> /data/pelican-admin-credentials.txt
echo "Password: ${ADMIN_PASSWORD}" >> /data/pelican-admin-credentials.txt
echo "Generated: $(date)" >> /data/pelican-admin-credentials.txt
chmod 600 /data/pelican-admin-credentials.txt

echo "Pelican configuration complete!"
