#!/bin/bash
# HyFern Hytale Server Installer
# Uses the embedded hytale-downloader to fetch server files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HYTFERN_DATA_DIR="${HYTFERN_DATA_DIR:-$SCRIPT_DIR/data/hytale}"
DOWNLOADER="$SCRIPT_DIR/hytale-downloader-linux-amd64"
CREDENTIALS_FILE="$SCRIPT_DIR/.hytale-downloader-credentials.json"

echo "=========================================="
echo "HyFern Hytale Server Installer"
echo "=========================================="

mkdir -p "$HYTFERN_DATA_DIR"

echo ""
echo "Target: $HYTFERN_DATA_DIR"
echo ""

# Check if server files already exist
if [ -f "$HYTFERN_DATA_DIR/HytaleServer.jar" ] && \
   [ -f "$HYTFERN_DATA_DIR/Assets.zip" ]; then
    echo "Server files already present!"
    ls -lh "$HYTFERN_DATA_DIR/"*.jar "$HYTFERN_DATA_DIR/"*.zip "$HYTFERN_DATA_DIR/"*.aot 2>/dev/null || true
    echo ""
    echo "To re-download, run: rm -rf $HYTFERN_DATA_DIR/*"
    exit 0
fi

# Check if downloader exists
if [ ! -f "$DOWNLOADER" ]; then
    echo "Error: hytale-downloader-linux-amd64 not found!"
    echo "Download from: https://downloader.hytale.com/hytale-downloader.zip"
    exit 1
fi

chmod +x "$DOWNLOADER"

echo "Starting Hytale downloader..."
echo ""

# Check for existing credentials
if [ -f "$CREDENTIALS_FILE" ]; then
    echo "Using existing credentials from $CREDENTIALS_FILE"
fi

echo "The downloader will now:"
echo "  1. Authenticate with your Hytale account (first time only)"
echo "  2. Download server files to $HYTFERN_DATA_DIR"
echo ""

# Run the downloader
cd "$HYTFERN_DATA_DIR"

# Use embedded downloader with credentials if available
if [ -f "$CREDENTIALS_FILE" ]; then
    "$DOWNLOADER" -skip-update-check -download-path . -credentials-path "$CREDENTIALS_FILE"
else
    "$DOWNLOADER" -skip-update-check -download-path .
fi

# The downloader extracts files, let's check what we got
echo ""
echo "Verifying files..."

# Find and rename the downloaded zip if needed
if [ -f "game.zip" ]; then
    echo "Extracting game.zip..."
    unzip -o game.zip
    rm -f game.zip
fi

# Check for required files
if [ -f "HytaleServer.jar" ] && [ -f "Assets.zip" ]; then
    echo "Download complete!"
    ls -lh HytaleServer.jar Assets.zip HytaleServer.aot 2>/dev/null || true
    
    # Copy credentials to data folder for persistence
    if [ -f "$CREDENTIALS_FILE" ] && [ ! -f "$HYTFERN_DATA_DIR/.hytale-downloader-credentials.json" ]; then
        cp "$CREDENTIALS_FILE" "$HYTFERN_DATA_DIR/"
    fi
else
    echo "Warning: Expected files not found in $HYTFERN_DATA_DIR"
    ls -la
    echo ""
    echo "If download failed, check authentication and re-run this script."
fi

echo ""
echo "=========================================="
echo "Server startup command:"
echo "  java -Xms\${HYTALE_MEMORY:-4G} -Xmx\${HYTALE_MAX_MEMORY:-6G} \\"
echo "    -XX:+Use\${HYTALE_GC:-G1GC} \\"
echo "    -XX:AOTCache=HytaleServer.aot \\"
echo "    -jar HytaleServer.jar --assets Assets.zip"
echo "=========================================="
