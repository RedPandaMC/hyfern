#!/bin/bash
# HyFern Hytale Server Installer
# This script downloads and sets up Hytale server files

set -e

HYTERN_DATA_DIR="${HYFERN_DATA_DIR:-./data/hytale}"
SERVER_JAR_URL="${SERVER_JAR_URL:-}"
AOT_CACHE_URL="${AOT_CACHE_URL:-}"

echo "=========================================="
echo "HyFern Hytale Server Installer"
echo "=========================================="

mkdir -p "$HYTERN_DATA_DIR"

echo ""
echo "Options:"
echo "  Data directory: $HYTERN_DATA_DIR"
echo ""

if [ -f "$HYTERN_DATA_DIR/HytaleServer.jar" ]; then
    echo "HytaleServer.jar already exists at $HYTERN_DATA_DIR/HytaleServer.jar"
    read -p "Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping JAR download."
    else
        echo "Please provide the new SERVER_JAR_URL or manually replace the file."
    fi
fi

echo ""
echo "To install Hytale server files:"
echo "1. Download Hytale server files from your Hytale installation"
echo "   - On Windows: C:\\Program Files\\Hytale Game\\hytale-server"
echo "   - Or obtain from your server provider"
echo ""
echo "2. Copy these files to $HYTERN_DATA_DIR/:"
echo "   - HytaleServer.jar"
echo "   - HytaleServer.aot (optional but recommended)"
echo ""
echo "3. Optionally create $HYTERN_DATA_DIR/mods/ for your mods"
echo ""

if [ -f "$HYTERN_DATA_DIR/HytaleServer.jar" ]; then
    echo "Server JAR: FOUND"
    ls -lh "$HYTERN_DATA_DIR/HytaleServer.jar"
else
    echo "Server JAR: NOT FOUND - Please install manually"
fi

if [ -f "$HYTERN_DATA_DIR/HytaleServer.aot" ]; then
    echo "AOT Cache: FOUND"
    ls -lh "$HYTERN_DATA_DIR/HytaleServer.aot"
else
    echo "AOT Cache: NOT FOUND - Server will generate on first run"
fi

echo ""
echo "=========================================="
echo "Installation check complete!"
echo "=========================================="