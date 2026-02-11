#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOWNLOADER_DIR="$SCRIPT_DIR/hytale-downloader"
SERVER_DIR="$SCRIPT_DIR/server-data"
DATA_DIR="$SCRIPT_DIR/data"
DOWNLOADER="$DOWNLOADER_DIR/hytale-downloader-linux-amd64"

echo "============================================"
echo "  HyFern Server Setup"
echo "============================================"
echo ""

# -----------------------------------------------
# 1. Check prerequisites
# -----------------------------------------------
echo "==> Checking prerequisites..."

if ! command -v docker &>/dev/null; then
    echo "ERROR: docker is not installed"
    echo "  Install: https://docs.docker.com/engine/install/"
    exit 1
fi

if ! docker compose version &>/dev/null; then
    echo "ERROR: docker compose plugin not found"
    echo "  Install: https://docs.docker.com/compose/install/"
    exit 1
fi

if ! command -v unzip &>/dev/null; then
    echo "ERROR: unzip is not installed (apt install unzip)"
    exit 1
fi

echo "  docker: OK"
echo "  docker compose: OK"
echo "  unzip: OK"
echo ""

# -----------------------------------------------
# 2. Generate .env if missing
# -----------------------------------------------
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "==> No .env file found, generating from .env.example..."

    if [ ! -f "$SCRIPT_DIR/.env.example" ]; then
        echo "ERROR: .env.example not found"
        exit 1
    fi

    cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"

    # Generate random passwords
    gen_pass() { openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c "$1"; }

    sed -i "s|POSTGRES_PASSWORD=change_this_secure_password|POSTGRES_PASSWORD=$(gen_pass 30)|" "$SCRIPT_DIR/.env"
    sed -i "s|PELICAN_DB_PASSWORD=change_this_pelican_db_password|PELICAN_DB_PASSWORD=$(gen_pass 30)|" "$SCRIPT_DIR/.env"
    sed -i "s|FRONTEND_DB_PASSWORD=change_this_frontend_db_password|FRONTEND_DB_PASSWORD=$(gen_pass 30)|" "$SCRIPT_DIR/.env"
    sed -i "s|REDIS_PASSWORD=change_this_redis_password|REDIS_PASSWORD=$(gen_pass 30)|" "$SCRIPT_DIR/.env"
    sed -i "s|NEXTAUTH_SECRET=change_this_to_random_32_byte_secret|NEXTAUTH_SECRET=$(openssl rand -base64 32)|" "$SCRIPT_DIR/.env"
    sed -i "s|SERVER_ACCESS_PASSWORD=change_this_server_password|SERVER_ACCESS_PASSWORD=$(gen_pass 16)|" "$SCRIPT_DIR/.env"
    sed -i "s|SERVER_PASSWORD=change_this_server_password|SERVER_PASSWORD=$(gen_pass 12)|" "$SCRIPT_DIR/.env"
    sed -i "s|HYTALE_WEBSERVER_PASSWORD=change_this_webserver_password|HYTALE_WEBSERVER_PASSWORD=$(gen_pass 24)|" "$SCRIPT_DIR/.env"
    sed -i "s|GRAFANA_ADMIN_PASSWORD=change_this_grafana_password|GRAFANA_ADMIN_PASSWORD=$(gen_pass 20)|" "$SCRIPT_DIR/.env"

    # Generate Pelican APP_KEY
    APP_KEY=$(openssl rand -base64 32)
    sed -i "s|PELICAN_APP_KEY=base64:CHANGE_THIS_TO_GENERATED_KEY|PELICAN_APP_KEY=base64:${APP_KEY}|" "$SCRIPT_DIR/.env"

    echo "  Generated .env with random passwords"
    echo ""
    echo "  IMPORTANT: Edit .env to set your domain and email:"
    echo "    nano .env"
    echo ""
    echo "  At minimum, update:"
    echo "    - LETSENCRYPT_EMAIL"
    echo "    - PELICAN_APP_URL  (your panel domain)"
    echo "    - NEXTAUTH_URL     (your frontend domain)"
    echo "    - GRAFANA_ROOT_URL (your grafana domain)"
    echo "    - NEXT_PUBLIC_SERVER_ADDRESS"
    echo ""
    echo "  Re-run this script after editing .env."
    exit 0
fi

echo "  .env: OK"
echo ""

# -----------------------------------------------
# 3. Create required directories
# -----------------------------------------------
echo "==> Creating directories..."
mkdir -p "$SERVER_DIR"
mkdir -p "$SCRIPT_DIR/wings-config"
mkdir -p "$DATA_DIR/caddy/data"
mkdir -p "$DATA_DIR/caddy/config"
mkdir -p "$DATA_DIR/pelican-panel"
mkdir -p "$DATA_DIR/wings"
mkdir -p "$DATA_DIR/postgresql"
mkdir -p "$DATA_DIR/redis"
mkdir -p "$DATA_DIR/prometheus"
mkdir -p "$DATA_DIR/grafana"

# Grafana runs as UID 472 inside the container
chown -R 472:472 "$DATA_DIR/grafana" 2>/dev/null || true
# Prometheus runs as UID 65534 (nobody)
chown -R 65534:65534 "$DATA_DIR/prometheus" 2>/dev/null || true

echo "  data/: OK (all service directories created)"
echo "  server-data/: OK"
echo "  wings-config/: OK"
echo ""

# -----------------------------------------------
# 4. Detect Docker socket path
# -----------------------------------------------
if [ -d "/var/snap/docker/common/var-lib-docker/containers" ]; then
    if ! grep -q "DOCKER_CONTAINERS_PATH" "$SCRIPT_DIR/.env"; then
        echo "DOCKER_CONTAINERS_PATH=/var/snap/docker/common/var-lib-docker/containers" >> "$SCRIPT_DIR/.env"
        echo "  Auto-configured: DOCKER_CONTAINERS_PATH for snap Docker"
    fi
fi

# -----------------------------------------------
# 5. Download Hytale server files
# -----------------------------------------------
echo "==> Downloading Hytale server..."
if [ ! -f "$DOWNLOADER" ]; then
    echo "  WARNING: hytale-downloader not found at $DOWNLOADER"
    echo "  Skipping server download. Run ./update-server.sh later."
    echo ""
else
    chmod +x "$DOWNLOADER"
    cd "$DOWNLOADER_DIR"
    "$DOWNLOADER"

    ZIP_FILE=$(ls -t "$DOWNLOADER_DIR"/*.zip 2>/dev/null | head -1)
    if [ -n "$ZIP_FILE" ]; then
        echo "==> Extracting $ZIP_FILE..."
        unzip -o "$ZIP_FILE" -d "$SERVER_DIR"

        if [ -d "$SERVER_DIR/Server" ]; then
            cp -rf "$SERVER_DIR/Server/"* "$SERVER_DIR/"
            rm -rf "$SERVER_DIR/Server"
        fi

        rm -f "$ZIP_FILE"
    fi
    cd "$SCRIPT_DIR"
    echo ""
fi

# -----------------------------------------------
# 6. Start infrastructure (DB + Redis)
# -----------------------------------------------
echo "==> Starting PostgreSQL and Redis..."
docker compose up -d postgresql redis
echo "  Waiting for PostgreSQL to be healthy..."
until docker compose exec -T postgresql pg_isready -U "$(grep '^POSTGRES_USER=' .env | cut -d= -f2)" &>/dev/null; do
    sleep 2
done
echo "  PostgreSQL: OK"
echo "  Redis: OK"
echo ""

# -----------------------------------------------
# 7. Start Pelican Panel
# -----------------------------------------------
echo "==> Starting Pelican Panel..."
docker compose up -d pelican-panel
echo "  Waiting for Panel to be ready..."
for i in $(seq 1 60); do
    if docker compose exec -T pelican-panel wget -q --spider http://localhost:80 2>/dev/null; then
        break
    fi
    sleep 2
done
echo "  Panel: OK"
echo ""

# -----------------------------------------------
# 8. Wings config check
# -----------------------------------------------
if [ ! -f "$SCRIPT_DIR/wings-config/config.yml" ]; then
    echo "============================================"
    echo "  Wings Configuration Required"
    echo "============================================"
    echo ""
    echo "  Wings needs a config.yml to start."
    echo ""
    PANEL_URL=$(grep '^PELICAN_APP_URL=' .env | cut -d= -f2)
    echo "  1. Open ${PANEL_URL:-https://panel.hyfern.us}"
    echo "  2. Complete the installer wizard (if first run)"
    echo "  3. Create a Node (Admin > Nodes > Create)"
    echo "  4. Copy the config.yml from the node's Configuration tab"
    echo "  5. Save to: ./wings-config/config.yml"
    echo "  6. Then run: docker compose up -d wings"
    echo ""
else
    echo "  Wings config: OK"
    echo "==> Starting Wings..."
    docker compose up -d wings
    echo ""
fi

# -----------------------------------------------
# 9. Start remaining services
# -----------------------------------------------
echo "==> Starting frontend, Caddy, Prometheus, Grafana..."
docker compose up -d
echo ""

echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "Data directories: ./data/"
echo ""
echo "Remaining steps:"
echo "  1. Import egg: egg/egg-hytale.json (Admin > Eggs > Import)"
echo "  2. Create the Hytale server in the Panel"
echo "  3. Copy API keys to .env, then: docker compose restart hyfern-frontend"
echo ""
