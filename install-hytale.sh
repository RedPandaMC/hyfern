#!/bin/bash
# HyFern Hytale Server Installer
# Uses the bundled hytale-downloader to fetch server files

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

# Run the downloader - it will handle auth flow
cd "$HYTFERN_DATA_DIR"

# Copy existing credentials if available
if [ -f "$CREDENTIALS_FILE" ] && [ ! -f "$HYTFERN_DATA_DIR/.hytale-downloader-credentials.json" ]; then
    cp "$CREDENTIALS_FILE" "$HYTFERN_DATA_DIR/"
fi

# Use embedded downloader
"$DOWNLOADER" -skip-update-check -download-path hytale-game.zip

# Find and extract the zip
echo ""
echo "Extracting files..."

# Rename any zip file to game.zip for extraction (downloader's naming can vary)
for f in *.zip; do
    if [ -f "$f" ] && [ "$f" != "Assets.zip" ]; then
        mv "$f" game.zip
    fi
done

if [ -f "game.zip" ]; then
    unzip -o game.zip
    rm -f game.zip
fi

# Move Server folder contents to root if it exists
if [ -d "Server" ]; then
    if [ -f "Server/HytaleServer.jar" ]; then
        mv Server/HytaleServer.jar .
    fi
    if [ -f "Server/HytaleServer.aot" ]; then
        mv Server/HytaleServer.aot .
    fi
    rm -rf Server
fi

# Check for required files
if [ -f "HytaleServer.jar" ] && [ -f "Assets.zip" ]; then
    echo "Download complete!"
    ls -lh HytaleServer.jar Assets.zip HytaleServer.aot 2>/dev/null || true
    
    # Copy credentials back for future runs
    if [ -f "$HYTFERN_DATA_DIR/.hytale-downloader-credentials.json" ] && [ ! -f "$CREDENTIALS_FILE" ]; then
        cp "$HYTFERN_DATA_DIR/.hytale-downloader-credentials.json" "$CREDENTIALS_FILE"
    fi
else
    echo "Warning: Expected files not found in $HYTFERN_DATA_DIR"
    ls -la
    echo ""
    echo "If download failed, check authentication and re-run this script."
    exit 1
fi

echo ""
echo "=========================================="
echo "Installing WebServer Plugins..."
echo "=========================================="

# Create mods directory
mkdir -p mods

# Download Nitrado WebServer plugin
echo "Downloading Nitrado WebServer plugin..."
curl -L -o mods/nitrado-webserver-1.1.1.jar \
    https://github.com/nitrado/hytale-plugin-webserver/releases/download/v1.1.1/nitrado-webserver-1.1.1.jar

# Download Nitrado Query plugin
echo "Downloading Nitrado Query plugin..."
curl -L -o mods/nitrado-query-1.1.0.jar \
    https://github.com/nitrado/hytale-plugin-query/releases/download/v1.1.0/nitrado-query-1.1.0.jar

# Download ApexHosting PrometheusExporter plugin
echo "Downloading ApexHosting PrometheusExporter plugin..."
curl -L -o mods/apexhosting-prometheusexporter-1.0.0.jar \
    https://github.com/apexhosting/hytale-plugin-prometheus/releases/download/v1.0.0/apexhosting-prometheusexporter-1.0.0.jar

# Create plugin config directories and config files
mkdir -p mods/Nitrado_WebServer
mkdir -p mods/Nitrado_Query
mkdir -p mods/ApexHosting_PrometheusExporter

# WebServer plugin config
cat > mods/Nitrado_WebServer/config.json << 'EOF'
{
  "BindHost": "0.0.0.0",
  "BindPort": 5523,
  "EnableTls": false
}
EOF

# Query plugin config
cat > mods/Nitrado_Query/config.json << 'EOF'
{
  "BindHost": "0.0.0.0",
  "BindPort": 5523,
  "EnableTls": false
}
EOF

# Prometheus exporter config
cat > mods/ApexHosting_PrometheusExporter/config.json << 'EOF'
{
  "BindHost": "0.0.0.0",
  "BindPort": 5523,
  "EnableTls": false
}
EOF

echo "Plugins installed successfully!"
ls -lh mods/*.jar

echo ""
echo "=========================================="
echo "Server startup command:"
echo "  java -Xms\${HYTALE_MEMORY:-4G} -Xmx\${HYTALE_MAX_MEMORY:-6G} \\"
echo "    -XX:+Use\${HYTALE_GC:-G1GC} \\"
echo "    -XX:AOTCache=HytaleServer.aot \\"
echo "    -jar HytaleServer.jar --assets Assets.zip"
echo "=========================================="
