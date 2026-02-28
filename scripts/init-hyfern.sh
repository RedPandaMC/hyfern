#!/bin/bash
set -e

echo "=========================================="
echo "HyFern Unified Initialization Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Step 1: Create all required directories
echo ""
print_status "Step 1/6: Creating required directories..."
mkdir -p /data/grafana
mkdir -p /data/prometheus
mkdir -p /data/frontend-uploads/avatars
mkdir -p /data/database
mkdir -p /data/pelican-database
mkdir -p /data/pelican-panel
mkdir -p /data/hytale
mkdir -p /data/wings
mkdir -p /data/wings-config
mkdir -p /data/redis
mkdir -p /data/caddy/data
mkdir -p /data/caddy/config
mkdir -p /data/caddy/locks
print_success "Directories created"

# Step 2: Set ownerships
echo ""
print_status "Step 2/6: Setting directory ownerships..."
chown 472:472 /data/grafana
chown 65534:65534 /data/prometheus
chown 1001:1001 /data/frontend-uploads /data/frontend-uploads/avatars /data/database /data/hytale
chown 33:33 /data/pelican-database /data/pelican-panel
chown 988:988 /data/wings /data/wings-config 2>/dev/null || true
chmod 755 /data/grafana /data/prometheus /data/frontend-uploads /data/database /data/pelican-database /data/hytale /data/wings /data/wings-config /data/redis /data/caddy
print_success "Ownerships set"

# Step 3: Initialize HyFern database
echo ""
print_status "Step 3/6: Checking HyFern database..."
if [ ! -f "/data/database/hyfern.db" ]; then
    touch /data/database/hyfern.db
    chown 1001:1001 /data/database/hyfern.db
    chmod 664 /data/database/hyfern.db
    print_success "HyFern database initialized"
else
    chown 1001:1001 /data/database/hyfern.db 2>/dev/null || true
    chmod 664 /data/database/hyfern.db 2>/dev/null || true
    print_success "HyFern database exists"
fi

# Step 4: Initialize Pelican database
echo ""
print_status "Step 4/6: Checking Pelican database..."
if [ ! -f "/data/pelican-database/database.sqlite" ]; then
    print_status "Creating empty Pelican SQLite database..."
    sqlite3 /data/pelican-database/database.sqlite "VACUUM;"
    chown 33:33 /data/pelican-database/database.sqlite
    chmod 664 /data/pelican-database/database.sqlite
    print_success "Pelican database initialized"
else
    print_success "Pelican database exists"
fi

# Step 5: Auto-configure Pelican Panel
echo ""
print_status "Step 5/6: Auto-configuring Pelican Panel..."

# Check if Pelican is already configured
if [ -f "/data/pelican-panel/.env" ]; then
    if grep -q "APP_INSTALLED=true" /data/pelican-panel/.env 2>/dev/null; then
        print_success "Pelican already configured"
    else
        print_warning "Pelican .env exists but not marked as installed"
    fi
else
    print_warning "Pelican .env not found in expected location"
fi

# Note: Full auto-configuration requires running commands inside the container
# after it starts. This will be handled by a separate script.
print_status "Pelican auto-configuration will run after container starts"
print_success "Pelican configuration prepared"

# Step 6: Final permissions
echo ""
print_status "Step 6/6: Finalizing permissions..."
chmod 755 /data/grafana /data/prometheus /data/frontend-uploads /data/database /data/pelican-database /data/hytale /data/wings /data/wings-config /data/redis /data/caddy
print_success "Permissions finalized"

echo ""
echo "=========================================="
echo -e "${GREEN}Initialization Complete!${NC}"
echo "=========================================="
echo ""
