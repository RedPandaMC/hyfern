#!/bin/bash
# HyFern Hytale Server Automatic Installer
# Downloads and sets up Hytale server files automatically

set -e

HYTFERN_DATA_DIR="${HYTFERN_DATA_DIR:-./data/hytale}"
DOWNLOADER_URL="${DOWNLOADER_URL:-https://downloader.hytale.com/hytale-downloader.zip}"

echo "=========================================="
echo "HyFern Hytale Server Installer"
echo "=========================================="

mkdir -p "$HYTFERN_DATA_DIR"

echo ""
echo "Installing to: $HYTFERN_DATA_DIR"
echo ""

# Check if files already exist
if [ -f "$HYTFERN_DATA_DIR/HytaleServer.jar" ] && \
   [ -f "$HYTFERN_DATA_DIR/Assets.zip" ]; then
    echo "Server files already present!"
    ls -lh "$HYTFERN_DATA_DIR/"
    echo ""
    echo "To re-download, delete existing files first:"
    echo "  rm -rf $HYTFERN_DATA_DIR/*"
    exit 0
fi

# Download and extract hytale-downloader
echo "[1/3] Downloading Hytale Downloader..."
cd /tmp

if command -v curl &> /dev/null; then
    curl -fsSL --output hytale-downloader.zip "$DOWNLOADER_URL"
else
    wget -q --output-document=hytale-downloader.zip "$DOWNLOADER_URL"
fi

echo "Extracting..."
unzip -o hytale-downloader.zip

# Find and make executable
if [ -f "hytale-downloader-linux-amd64" ]; then
    mv hytale-downloader-linux-amd64 "$HYTFERN_DATA_DIR/hytale-downloader"
elif [ -f "hytale-downloader-windows-amd64.exe" ]; then
    echo "Warning: Downloaded Windows version. Please run on Linux or download Linux version manually."
    exit 1
fi

chmod +x "$HYTFERN_DATA_DIR/hytale-downloader"

# Download server files
echo ""
echo "[2/3] Downloading Hytale server files..."
cd "$HYTFERN_DATA_DIR"

./hytale-downloader

echo ""
echo "[3/3] Verifying files..."
if [ -f "HytaleServer.jar" ] && [ -f "Assets.zip" ]; then
    echo "Download complete!"
    ls -lh *.jar *.aot *.zip 2>/dev/null || true
else
    echo "Error: Expected files not found"
    exit 1
fi

echo ""
echo "=========================================="
echo "Server will start with:"
echo "  java -Xms${HYTALE_MEMORY:-4G} -Xmx${HYTALE_MAX_MEMORY:-6G} \\"
echo "    -XX:+Use${HYTALE_GC:-G1GC} \\"
echo "    -XX:AOTCache=HytaleServer.aot \\"
echo "    -jar HytaleServer.jar --assets Assets.zip"
echo "=========================================="

echo ""
echo "Next: docker compose up -d"
