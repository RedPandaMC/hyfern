# HyFern

A self-hosted Hytale server management dashboard. Manage your server, mods, backups, JVM settings, and monitor performance — all from a single web interface.

## Features

- **Server Management**: Start, stop, restart, and monitor your Hytale server
- **Real-time Console**: Web-based terminal with live server output
- **Mod Management**: Browse, install, and manage Hytale mods via CurseForge integration
- **Performance Monitoring**: Real-time TPS, memory, CPU, and player analytics
- **JVM Configuration**: Fine-tune garbage collection, memory allocation, and startup flags
- **File Manager**: Browse, edit, and upload files to your server
- **Backup System**: Automated backups with configurable retention
- **Role-based Access**: OWNER, ADMIN, MODERATOR, and VIEWER permission levels
- **Two-Factor Authentication**: TOTP-based 2FA with recovery codes
- **Unified Login**: Single sign-on across frontend, Grafana, and all services

## Architecture

| Service | Description | Domain |
|---------|-------------|--------|
| **Frontend** | Next.js dashboard (server control, mods, analytics) | `hyfern.us` |
| **Pterodactyl Panel** | Server management panel | `panel.hyfern.us` |
| **Wings** | Daemon that runs game server containers | `api.hyfern.us` |
| **Hytale Server** | Game server with WebServer plugin | — |
| **Caddy** | Reverse proxy with automatic HTTPS | ports 80/443 |
| **MariaDB** | Database for Pterodactyl Panel | — |
| **SQLite** | File-based database for frontend | — |
| **Redis** | Caching and rate limiting | — |
| **Prometheus** | Metrics collection from game server | — |
| **Grafana** | Metrics dashboards (embedded in frontend) | `grafana.hyfern.us` |

## Prerequisites

- Linux server with Docker and Docker Compose
- A domain pointing to your server (default: `hyfern.us` + subdomains)
- A Hytale account with server access
- (Optional) CurseForge API key for mod management

## Quick Start

### 1. Clone and configure

```bash
git clone https://github.com/RedPandaMC/hyfern.git
cd hyfern
cp .env.example .env
nano .env  # Fill in all values
```

### 2. Start everything

```bash
docker compose up -d
```

Wait for all services to become healthy:
```bash
docker compose ps
# All should show "healthy" status
```

### 3. Complete Pterodactyl Panel Setup

Once all services are running, complete the Pterodactyl Panel installation:

1. **Visit the installer**: Navigate to `https://panel.hyfern.us`
2. **Create admin account**: Enter your desired username and password
3. **Complete setup**: The panel will automatically configure with MariaDB

### 4. Configure Pterodactyl Node (Wings)

After logging into the panel as admin:

#### a. Create a Location
1. Go to **Locations** (Admin → Locations)
2. Click **Create New**
3. Fill in:
   - **Short Name**: `main`
   - **Description**: `HyFern Main Location`
4. Click **Create Location**

#### b. Create a Node
1. Go to **Nodes** (Admin → Nodes)
2. Click **Create New**
3. Fill in:
   - **Name**: `HyFern Node`
   - **Location**: Select the location you just created
   - **FQDN**: `api.hyfern.us` (or your server's IP)
   - **Communicate over SSL**: Unchecked (for internal Docker networking)
   - **Behind Proxy**: Checked
   - **Memory**: 8192 (or your available RAM in MB)
   - **Allocated Memory**: 6144
   - **Disk Space**: 50000 (or your available disk in MB)
   - **Allocated Disk Space**: 30000
4. Click **Create Node**

#### c. Configure Wings
After creating the node, you'll see a **Configuration** tab:

1. Click the **Configuration** tab
2. Copy the entire configuration shown
3. Update the wings config file:
   ```bash
   nano data/pterodactyl-wings/etc/pterodactyl/config.yml
   ```
4. Paste the configuration and save
5. Restart wings:
   ```bash
   docker compose restart pterodactyl-wings
   ```

#### d. Create a Server
1. Go to **Servers** (Admin → Servers)
2. Click **Create New**
3. Fill in:
   - **Name**: `Hytale Server`
   - **Node**: Select your node
   - **Nest**: Select "Hytale" (or import the egg first)
   - **Egg**: Select the Hytale egg
   - **Docker Image**: Leave default or set custom
   - **Allocations**:
     - Default Allocation: Select the generated allocation
   - **Resource Limits**: Set memory, disk, CPU as desired
4. Click **Create Server**

### 5. Import Custom Hytale Egg (Recommended)

Import the custom egg for better Hytale support:

1. Go to **Nests** (Admin → Nests)
2. Click **Import Egg**
3. Upload `egg/egg-hytale.yaml`
4. The egg will be imported with Hytale-specific configurations

### 6. Verify Deployment

```bash
# Check all services are running
docker compose ps

# View logs
docker compose logs -f
```

## Environment Variables

Create a `.env` file with the following variables:

```bash
# General
TZ=UTC
LETSENCRYPT_EMAIL=your-email@example.com

# Database
MYSQL_ROOT_PASSWORD=your_secure_root_password
PTERODACTYL_DB_PASSWORD=your_secure_db_password

# Redis
REDIS_PASSWORD=your_secure_redis_password

# Frontend
NEXTAUTH_URL=https://hyfern.us
NEXTAUTH_SECRET=generate_a_secure_secret
SERVER_ACCESS_PASSWORD=your_server_access_password

# Pterodactyl
PTERODACTYL_APP_URL=https://panel.hyfern.us
PTERODACTYL_APP_KEY=generate_with_pterodactyl_command
PTERODACTYL_API_KEY=will_be_set_after_panel_setup
PTERODACTYL_SERVER_UUID=will_be_set_after_creating_server

# Hytale
HYTALE_WEBSERVER_USERNAME=hyfern
HYTALE_WEBSERVER_PASSWORD=your_webserver_password

# Monitoring
GRAFANA_ADMIN_PASSWORD=your_grafana_password
PROMETHEUS_PASSWORD=your_prometheus_password
```

Generate secrets with:
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# PTERODACTYL_APP_KEY (run in pterodactyl panel container)
docker exec hyfern-pterodactyl-panel php artisan key:generate --show
```

## Project Structure

```
.
├── Caddyfile                    # Reverse proxy config
├── docker-compose.yml           # All services
├── .env.example                 # Environment variable template
├── pterodactyl/                 # Custom Pterodactyl Docker config
│   └── Dockerfile               # Panel with mariadb-client
├── config/
│   └── pterodactyl/             # Pterodactyl config mount
├── data/                        # Data directories
│   ├── pterodactyl/             # Panel storage
│   ├── pterodactyl-wings/       # Wings data and config
│   ├── database/                # Frontend SQLite
│   ├── hytale/                  # Hytale server files
│   └── ...
├── egg/                         # Server eggs
│   └── egg-hytale.yaml          # Hytale egg definition
├── frontend/                    # Next.js dashboard
│   ├── Dockerfile
│   ├── app/                     # Pages and API routes
│   ├── components/              # UI components
│   └── lib/                     # Auth, database, utilities
└── observability/               # Monitoring
    ├── grafana/                 # Grafana config
    └── prometheus/              # Prometheus config
```

## Ports

| Port | Protocol | Service |
|------|----------|---------|
| 80 | TCP | Caddy (HTTP, redirects to HTTPS) |
| 443 | TCP | Caddy (HTTPS) |
| 5520 | UDP | Hytale game server (configurable) |
| 8443 | TCP | Pterodactyl Wings API |
| 8080 | TCP | Pterodactyl Wings (internal) |

All other services communicate internally via Docker networks.

## Troubleshooting

### Pterodactyl Panel Not Healthy

If the panel shows as unhealthy:
```bash
docker compose logs pterodactyl-panel
```

Common issues:
- Database migration failed: Check DB credentials in .env
- SSL errors: Update DB_SSL_MODE in docker-compose.yml

### Wings Container Not Starting

If wings keeps restarting:
```bash
docker compose logs pterodactyl-wings
```

Usually means:
- Configuration file is missing or invalid
- Node not configured in the panel
- Token is incorrect

Fix by updating the config:
```bash
nano data/pterodactyl-wings/etc/pterodactyl/config.yml
docker compose restart pterodactyl-wings
```

### Frontend API Errors

If the frontend shows errors when connecting to Pterodactyl:
1. Check that `PTERODACTYL_API_KEY` is set in .env
2. Check that `PTERODACTYL_SERVER_UUID` matches the server in the panel
3. Restart the frontend: `docker compose restart hyfern-frontend`

### Services Not Starting

Check individual service logs:
```bash
# Frontend
docker compose logs hyfern-frontend

# Pterodactyl Panel
docker compose logs pterodactyl-panel

# Check all services
docker compose ps
```

### Permission Issues

If you see permission errors:
```bash
# The init container handles this on startup
# But you can manually fix:
chown -R 1001:1001 data/database
chown -R 988:988 data/pterodactyl-wings
```

## Building from Source

### Build Frontend
```bash
cd frontend
docker build -t your-dockerhub-user/hyfern-frontend:latest .
docker push your-dockerhub-user/hyfern-frontend:latest
```

### Rebuild Pterodactyl Panel
```bash
docker compose build pterodactyl-panel
```

## License

MIT