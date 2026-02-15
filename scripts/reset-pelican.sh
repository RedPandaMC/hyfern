#!/bin/sh
# Pelican Panel Database Reset and Admin Creation Script
# WARNING: This will DELETE existing Pelican data and recreate the admin user

set -e

echo "==================================================="
echo "Pelican Panel Admin Recovery Script"
echo "==================================================="
echo ""
echo "This script will:"
echo "1. Stop the Pelican Panel container"
echo "2. BACKUP and DELETE the existing database"
echo "3. Restart Pelican to trigger fresh setup"
echo "4. Provide instructions for creating the admin user"
echo ""
echo "WARNING: Any existing servers, users, or configuration"
echo "         in Pelican will be LOST!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Step 1: Stopping Pelican Panel..."
docker compose stop pelican-panel

echo ""
echo "Step 2: Backing up existing database..."
backup_dir="./backups/pelican-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$backup_dir"
if [ -f ./data/pelican-database/database.sqlite ]; then
    cp ./data/pelican-database/database.sqlite "$backup_dir/"
    echo "Backup created at: $backup_dir/database.sqlite"
else
    echo "No existing database found to backup"
fi

echo ""
echo "Step 3: Removing existing database..."
rm -f ./data/pelican-database/database.sqlite
rm -rf ./data/pelican-panel/cache/*

echo ""
echo "Step 4: Restarting Pelican Panel..."
docker compose up -d pelican-panel

echo ""
echo "==================================================="
echo "Setup Complete!"
echo "==================================================="
echo ""
echo "Pelican Panel is now restarting with a fresh database."
echo ""
echo "Next steps:"
echo "1. Wait 30 seconds for the container to initialize"
echo "2. Visit: https://panel.hyfern.us/installer"
echo "3. Complete the web setup wizard:"
echo "   - Database: SQLite (default)"
echo "   - Redis: Already configured"
echo "   - Email: Configure or use 'log' driver"
echo "   - Create your admin account"
echo ""
echo "4. After setup, configure Wings (see README.md section 5.4)"
echo ""
echo "To check if Pelican is ready:"
echo "  docker compose logs -f pelican-panel"
echo ""
echo "Backup location: $backup_dir/"
echo ""
