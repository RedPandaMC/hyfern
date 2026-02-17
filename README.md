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

### 4. Complete setup wizard

Visit `https://panel.hyfern.us/installer` and complete the setup wizard.

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

## License

MIT

## Recent Changes

### Frontend Optimizations (2025-02-17)

- **Code Quality**: Removed duplicate CurseForge type definitions, consolidated logging
- **Performance**: Implemented dynamic imports for heavy components (ConstellationBackground, xterm.js, recharts)
- **Error Handling**: Added per-page ErrorBoundaries for better UX and debugging
- **Configuration**: Moved hardcoded URLs to environment variables (`NEXT_PUBLIC_GRAFANA_URL`, `NEXT_PUBLIC_PANEL_URL`)
- **Dependencies**: Removed unused ioredis from package.json (still available as optional dependency)
