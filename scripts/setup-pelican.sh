#!/bin/sh
# Pelican Panel Auto-Configuration Script

echo "=========================================="
echo "Pelican Panel Auto-Configuration"
echo "=========================================="

cd /var/www/html

# Check if already installed
if grep -q "APP_INSTALLED=true" /pelican-data/.env 2>/dev/null; then
    echo "✓ Pelican already configured"
    exit 0
fi

echo "Setting up Pelican environment..."

# Create .env file if not exists
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
EOF
    
    ln -sf /pelican-data/.env /var/www/html/.env
    chown www-data:www-data /pelican-data/.env
    chmod 640 /pelican-data/.env
fi

# Ensure database directory is writable
echo "Setting database permissions..."
chmod 777 /var/www/html/database
chmod 666 /var/www/html/database/database.sqlite 2>/dev/null || true
chown -R www-data:www-data /var/www/html/database 2>/dev/null || true

# Wait for database to be ready
echo "Waiting for services..."
sleep 5

# Run migrations
echo "Running database migrations..."
php artisan migrate --force --no-interaction 2>&1 || echo "⚠ Migrations may have already run"

# Generate key if not exists
if ! grep -q "APP_KEY=base64:" /pelican-data/.env 2>/dev/null; then
    echo "Generating application key..."
    php artisan key:generate --force --no-interaction
fi

# Create admin user
echo "Creating admin user..."
ADMIN_PASSWORD=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)

php artisan make:filament-user \
    --name="Administrator" \
    --email="hyfern-admin@hyfern.us" \
    --password="${ADMIN_PASSWORD}" \
    --no-interaction 2>&1 || echo "⚠ Admin user creation may have failed"

# Mark as installed
sed -i 's/APP_INSTALLED=false/APP_INSTALLED=true/' /pelican-data/.env 2>/dev/null || true

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
chmod 600 /data/pelican-admin-credentials.txt 2>/dev/null || true

echo "✓ Pelican configuration complete!"
echo ""
echo "Access the panel at: https://panel.hyfern.us"
