#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOWNLOADER_DIR="$SCRIPT_DIR/hytale-downloader"
SERVER_DIR="$SCRIPT_DIR/server-data"
DOWNLOADER="$DOWNLOADER_DIR/hytale-downloader-linux-amd64"

echo "============================================"
echo "  HyFern Server Setup"
echo "============================================"
echo ""

# 1. Check prerequisites
echo "==> Checking prerequisites..."

if ! command -v docker &>/dev/null; then
    echo "ERROR: docker is not installed"
    exit 1
fi

if ! command -v unzip &>/dev/null; then
    echo "ERROR: unzip is not installed (apt install unzip)"
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "ERROR: .env file not found"
    echo "  Copy .env.example to .env and fill in your values:"
    echo "  cp .env.example .env"
    exit 1
fi

echo "  docker: OK"
echo "  unzip: OK"
echo "  .env: OK"
echo ""

# 2. Create required directories
echo "==> Creating directories..."
mkdir -p "$SERVER_DIR"
mkdir -p "$SCRIPT_DIR/wings-config"
echo "  server-data/: OK"
echo "  wings-config/: OK"
echo ""

# 3. Download Hytale server files
echo "==> Downloading Hytale server..."
if [ ! -f "$DOWNLOADER" ]; then
    echo "ERROR: hytale-downloader not found at $DOWNLOADER"
    echo "  The downloader binary should be in hytale-downloader/"
    exit 1
fi

chmod +x "$DOWNLOADER"
cd "$DOWNLOADER_DIR"
"$DOWNLOADER"

# Find and extract the downloaded zip
ZIP_FILE=$(ls -t "$DOWNLOADER_DIR"/*.zip 2>/dev/null | head -1)
if [ -z "$ZIP_FILE" ]; then
    echo "ERROR: No zip file found after download"
    exit 1
fi

echo "==> Extracting $ZIP_FILE..."
unzip -o "$ZIP_FILE" -d "$SERVER_DIR"

# Move files from Server/ subdirectory if it exists
if [ -d "$SERVER_DIR/Server" ]; then
    cp -rf "$SERVER_DIR/Server/"* "$SERVER_DIR/"
    rm -rf "$SERVER_DIR/Server"
fi

rm -f "$ZIP_FILE"
cd "$SCRIPT_DIR"
echo ""

# 4. Start infrastructure services (DB, Redis, Panel)
echo "==> Starting infrastructure services..."
docker compose up -d postgresql redis
echo "  Waiting for PostgreSQL to be healthy..."
until docker compose exec postgresql pg_isready -U "$(grep POSTGRES_USER .env | cut -d= -f2)" &>/dev/null; do
    sleep 2
done
echo "  PostgreSQL: OK"
echo ""

# 5. Start Pelican Panel
echo "==> Starting Pelican Panel..."
docker compose up -d pelican-panel
echo "  Waiting for Panel to start (this may take a minute on first run)..."
sleep 15
echo ""

echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo ""
echo "  1. Open https://panel.hyfern.us/installer in your browser"
echo "     Complete the Pelican Panel setup wizard"
echo ""
echo "  2. Create a Node in the Panel (Admin > Nodes > Create)"
echo "     - FQDN: your server IP or domain"
echo "     - Copy the generated config.yml to ./wings-config/config.yml"
echo ""
echo "  3. Start Wings:"
echo "     docker compose up -d wings"
echo ""
echo "  4. Import the egg (Admin > Eggs > Import):"
echo "     Upload egg/egg-hytale.json"
echo ""
echo "  5. Create the Hytale server in the Panel"
echo "     - Select the Hytale Server egg"
echo "     - Assign port allocation (UDP 5520)"
echo ""
echo "  6. Get API keys from the Panel and update .env:"
echo "     - WINGS_API_KEY (from Node config)"
echo "     - WINGS_SERVER_UUID (from server details)"
echo "     - PELICAN_API_KEY (from API keys page)"
echo "     - PELICAN_SERVER_UUID (same as WINGS_SERVER_UUID)"
echo ""
echo "  7. Start all remaining services:"
echo "     docker compose up -d"
echo ""
echo "  8. Update the Prometheus password:"
echo "     Edit observability/prometheus/prometheus.yml"
echo "     Set the password from mods/WebServer/users.json"
echo ""
