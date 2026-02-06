#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOWNLOADER_DIR="$SCRIPT_DIR/hytale-downloader"
SERVER_DIR="$SCRIPT_DIR/server-data"
DOWNLOADER="$DOWNLOADER_DIR/hytale-downloader-linux-amd64"

# Check downloader exists
if [ ! -f "$DOWNLOADER" ]; then
    echo "ERROR: hytale-downloader not found at $DOWNLOADER"
    exit 1
fi

chmod +x "$DOWNLOADER"

# Download latest server
echo "==> Downloading latest Hytale server..."
cd "$DOWNLOADER_DIR"
"$DOWNLOADER" -skip-update-check

# Find the downloaded zip (most recent .zip file)
ZIP_FILE=$(ls -t "$DOWNLOADER_DIR"/*.zip 2>/dev/null | head -1)
if [ -z "$ZIP_FILE" ]; then
    echo "ERROR: No zip file found after download"
    exit 1
fi

echo "==> Extracting $ZIP_FILE to $SERVER_DIR..."
mkdir -p "$SERVER_DIR"
unzip -o "$ZIP_FILE" -d "$SERVER_DIR"

# Move files from Server/ subdirectory if it exists
if [ -d "$SERVER_DIR/Server" ]; then
    cp -rf "$SERVER_DIR/Server/"* "$SERVER_DIR/"
    rm -rf "$SERVER_DIR/Server"
fi

# Clean up zip to save disk space
echo "==> Cleaning up downloaded zip..."
rm -f "$ZIP_FILE"

echo "==> Done! Server files are in $SERVER_DIR"
echo ""
echo "To start/restart the server:"
echo "  docker compose restart hytale-server"
