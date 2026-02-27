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
|---|---|---|
| **Frontend** | Next.js dashboard (server control, mods, analytics) | `hyfern.us` |
| **Pelican Panel** | Container orchestration for game servers | `panel.hyfern.us` |
| **Wings** | Pelican daemon (manages server containers) | `api.hyfern.us` |
| **Hytale Server** | Game server with WebServer + PerformanceSaver plugins | — |
| **Caddy** | Reverse proxy with automatic HTTPS | ports 80/443 |
| **SQLite** | File-based database for frontend and Pelican | — |
| **Redis** | Caching and rate limiting (optional) | — |
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

### 2. Download the Hytale server

```bash
./update-server.sh
```

This will authenticate with your Hytale account (first run only), download the latest server build, and extract it to `server-data/`.

### 3. Start everything

```bash
docker compose up -d
```

### 4. Complete Pelican Panel Setup

Once all services are running, you need to complete the Pelican Panel installation:

1. **Visit the installer**: Navigate to `https://panel.hyfern.us/installer`

2. **Complete the setup wizard**:
   - Database: Select "SQLite" (the database is automatically created at `/var/www/html/database/database.sqlite`)
   - Cache: Redis is pre-configured
   - Create your admin account
   - Set your application URL to `https://panel.hyfern.us`

3. **Import the custom Hytale egg**:
   - Go to Admin → Nests
   - Click "Import Egg"
   - Upload the file `egg/egg-hytale.yaml` from this repository
   - The egg will be imported with all default configurations

4. **Configure Wings**:
   - Visit the admin panel
   - Go to Nodes and copy the Wings configuration
   - The Wings daemon is automatically configured to connect

### 5. Verify deployment

```bash
# Check all services are running
docker compose ps

# View logs
docker compose logs -f
```

See the [full documentation](docs/setup.md) for detailed setup instructions.

## Project Structure

```
.
├── Caddyfile                  # Reverse proxy config
├── docker-compose.yml         # All services
├── .env.example               # Environment variable template
├── init-db.sh                 # PostgreSQL initialization
├── update-server.sh           # Hytale server download/update script
├── egg/                       # Hytale server Docker image
│   ├── Dockerfile
│   ├── entrypoint.sh          # JVM startup script
│   ├── egg-hytale.json        # Pelican egg definition
│   └── default-configs/       # Default plugin configurations
├── frontend/                  # Next.js dashboard application
│   ├── Dockerfile
│   ├── app/                   # Pages and API routes
│   ├── components/            # UI components
│   ├── lib/                   # Auth, database, utilities
│   └── prisma/                # Database schema
├── observability/             # Monitoring stack
│   ├── grafana/               # Grafana config and provisioning
│   └── prometheus/            # Prometheus scrape config
├── server-data/               # Hytale server files (bind mounted)
└── hytale-downloader/         # Server download utility
```

## Ports

| Port | Protocol | Service |
|---|---|---|
| 80 | TCP | Caddy (HTTP, redirects to HTTPS) |
| 443 | TCP | Caddy (HTTPS) |
| 5520 | UDP | Hytale game server |

All other services communicate internally via Docker networks.

## Troubleshooting

### Pelican Panel Database Not Created

If you see `service "pelican-db-init" didn't complete successfully`, the SQLite database wasn't initialized:

```bash
# Rebuild and run the init service
docker compose build --no-cache pelican-db-init
docker compose run --rm pelican-db-init

# Verify database was created
ls -la data/pelican-database/
# Should show: database.sqlite (owned by www-data)
```

### Wings Container Restarting

If the Wings container keeps restarting, check the logs:

```bash
docker compose logs -f wings
```

Usually this means:
- Pelican Panel isn't fully initialized yet (wait for setup wizard completion)
- Wings configuration needs to be updated from the admin panel

### Services Not Starting

Check individual service logs:

```bash
# Frontend
docker compose logs -f hyfern-frontend

# Pelican Panel
docker compose logs -f pelican-panel

# Check all services
docker compose ps
```

### Permission Issues

If you see permission errors in the logs:

```bash
# Fix data directory permissions
docker compose run --rm init-permissions
```

## License

MIT

## Recent Changes

### Frontend Optimizations (2025-02-17)

- **Code Quality**: Removed duplicate CurseForge type definitions, consolidated logging
- **Performance**: Implemented dynamic imports for heavy components (ConstellationBackground, xterm.js, recharts)
- **Error Handling**: Added per-page ErrorBoundaries for better UX and debugging
- **Configuration**: Moved hardcoded URLs to environment variables (`NEXT_PUBLIC_GRAFANA_URL`, `NEXT_PUBLIC_PANEL_URL`)
- **Dependencies**: Removed unused ioredis from package.json (still available as optional dependency)
