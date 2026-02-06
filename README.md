# HyFern

A self-hosted Hytale server management dashboard. Manage your server, mods, backups, JVM settings, and monitor performance — all from a single web interface.

## Architecture

| Service | Description | Domain |
|---|---|---|
| **Frontend** | Next.js dashboard (server control, mods, analytics) | `hyfern.us` |
| **Pelican Panel** | Container orchestration for game servers | `panel.hyfern.us` |
| **Wings** | Pelican daemon (manages server containers) | `api.hyfern.us` |
| **Hytale Server** | Game server with WebServer + PerformanceSaver plugins | — |
| **Caddy** | Reverse proxy with automatic HTTPS | ports 80/443 |
| **PostgreSQL** | Database for Pelican Panel and frontend | — |
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

### 2. Download the Hytale server

```bash
./update-server.sh
```

This will authenticate with your Hytale account (first run only), download the latest server build, and extract it to `server-data/`.

### 3. Hash your WebServer plugin passwords

The Hytale WebServer plugin requires bcrypt-hashed passwords for service accounts. Generate hashes for the passwords you set in `.env`:

```bash
npx bcryptjs-cli "your-HYTALE_WEBSERVER_PASSWORD-here"
```

Update the hashes in:
- `server-data/mods/Nitrado_WebServer/provisioning/hyfern.serviceaccount.json`
- `server-data/mods/Nitrado_WebServer/provisioning/prometheus.serviceaccount.json`

### 4. Start everything

```bash
docker compose up -d
```

### 5. Set up Pelican Panel

Visit `https://panel.hyfern.us` and complete the initial setup. Generate API keys for Wings and the frontend (add them to your `.env` and restart).

## Updating the Hytale Server

```bash
./update-server.sh
docker compose restart hytale-server
```

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
