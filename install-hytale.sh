#!/bin/bash
# HyFern Hytale Server Installer
# This script sets up Hytale server files for the Docker container

set -e

HYTFERN_DATA_DIR="${HYFERN_DATA_DIR:-./data/hytale}"

echo "=========================================="
echo "HyFern Hytale Server Installer"
echo "=========================================="

mkdir -p "$HYTFERN_DATA_DIR"

echo ""
echo "Required files for $HYTFERN_DATA_DIR/:"
echo "  - HytaleServer.jar   (main server)"
echo "  - HytaleServer.aot   (AOT cache for faster startup)"
echo "  - Assets.zip         (game assets)"
echo ""

if [ -f "$HYTFERN_DATA_DIR/HytaleServer.jar" ] && \
   [ -f "$HYTFERN_DATA_DIR/HytaleServer.aot" ] && \
   [ -f "$HYTFERN_DATA_DIR/Assets.zip" ]; then
    echo "All required files present!"
    ls -lh "$HYTFERN_DATA_DIR/"
else
    echo "MISSING FILES - Please download from Hytale:"
    echo ""
    echo "Option 1: From Hytale Launcher"
    echo "  Windows: %appdata%\\Hytale\\install\\release\\package\\game\\latest"
    echo "  Linux: \$XDG_DATA_HOME/Hytale/install/release/package/game/latest"
    echo "  Copy: Server/ folder and Assets.zip"
    echo ""
    echo "Option 2: Hytale Downloader CLI"
    echo "  Download from Hytale support, run ./hytale-downloader"
    echo ""
    echo "Place these files in $HYTFERN_DATA_DIR/:"
    [ ! -f "$HYTFERN_DATA_DIR/HytaleServer.jar" ] && echo "  - HytaleServer.jar"
    [ ! -f "$HYTFERN_DATA_DIR/HytaleServer.aot" ] && echo "  - HytaleServer.aot"
    [ ! -f "$HYTFERN_DATA_DIR/Assets.zip" ] && echo "  - Assets.zip"
    echo ""
    echo "After placing files, run: docker compose up -d"
fi

echo ""
echo "=========================================="
echo "Server will start with:"
echo "  java -Xms${HYTALE_MEMORY:-4G} -Xmx${HYTALE_MAX_MEMORY:-6G} \\"
echo "    -XX:+Use${HYTALE_GC:-G1GC} \\"
echo "    -XX:AOTCache=HytaleServer.aot \\"
echo "    -jar HytaleServer.jar --assets Assets.zip"
echo "=========================================="
