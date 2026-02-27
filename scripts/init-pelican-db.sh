#!/bin/sh
set -e

# Pelican Panel Database Initialization Script
# This script creates the SQLite database file if it doesn't exist

DB_DIR="/data/pelican-database"
DB_FILE="$DB_DIR/database.sqlite"

echo "Checking Pelican database at $DB_FILE..."

if [ -f "$DB_FILE" ]; then
    echo "Database already exists, skipping initialization"
    exit 0
fi

# Create the database directory if it doesn't exist
mkdir -p "$DB_DIR"

# Create empty SQLite database
sqlite3 "$DB_FILE" "VACUUM;"

# Set proper permissions (www-data user in pelican container)
chown 33:33 "$DB_FILE"
chmod 664 "$DB_FILE"

echo "Created empty Pelican database at $DB_FILE"
echo "Database is ready for Pelican Panel installation"