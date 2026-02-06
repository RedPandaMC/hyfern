#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOWNLOADER_DIR="$SCRIPT_DIR/hytale-downloader"
SERVER_DIR="$SCRIPT_DIR/server-data"
DOWNLOADER="$DOWNLOADER_DIR/hytale-downloader-linux-amd64"

echo "============================================"
echo "  HyFern Server Update"
echo "============================================"
echo ""

# Check downloader exists
if [ ! -f "$DOWNLOADER" ]; then
    echo "ERROR: hytale-downloader not found at $DOWNLOADER"
    exit 1
fi

chmod +x "$DOWNLOADER"

# Check for available update
echo "==> Checking for updates..."
cd "$DOWNLOADER_DIR"
if "$DOWNLOADER" -print-version 2>/dev/null; then
    echo ""
fi

# Download latest server
echo "==> Downloading latest Hytale server..."
"$DOWNLOADER" -skip-update-check

# Find the downloaded zip (most recent .zip file)
ZIP_FILE=$(ls -t "$DOWNLOADER_DIR"/*.zip 2>/dev/null | head -1)
if [ -z "$ZIP_FILE" ]; then
    echo "No new zip file found — server may already be up to date."
    exit 0
fi

# Back up current server config before overwriting
echo "==> Backing up current config..."
BACKUP_DIR="$SCRIPT_DIR/backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
if [ -d "$SERVER_DIR/mods" ]; then
    cp -r "$SERVER_DIR/mods" "$BACKUP_DIR/"
fi
if [ -f "$SERVER_DIR/server-config.json" ]; then
    cp "$SERVER_DIR/server-config.json" "$BACKUP_DIR/"
fi
echo "  Backup saved to $BACKUP_DIR"

# Extract new server files
echo "==> Extracting $ZIP_FILE to $SERVER_DIR..."
mkdir -p "$SERVER_DIR"
unzip -o "$ZIP_FILE" -d "$SERVER_DIR"

# Move files from Server/ subdirectory if it exists
if [ -d "$SERVER_DIR/Server" ]; then
    cp -rf "$SERVER_DIR/Server/"* "$SERVER_DIR/"
    rm -rf "$SERVER_DIR/Server"
fi

# Restore mod configs (they may have been overwritten)
if [ -d "$BACKUP_DIR/mods" ]; then
    echo "==> Restoring mod configs..."
    cp -rf "$BACKUP_DIR/mods/"* "$SERVER_DIR/mods/" 2>/dev/null || true
fi

# Clean up zip
echo "==> Cleaning up downloaded zip..."
rm -f "$ZIP_FILE"

cd "$SCRIPT_DIR"
echo ""
echo "============================================"
echo "  Update Complete!"
echo "============================================"
echo ""
echo "Restart the server from the Pelican Panel UI,"
echo "or run:"
echo "  docker compose exec wings wings server restart"
echo ""
echo "Backup of previous config: $BACKUP_DIR"
echo ""
