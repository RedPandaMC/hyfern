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

### 3. Configure WebServer plugin credentials

The Hytale WebServer plugin service accounts are automatically configured from environment variables on first run:

**Required environment variables** (set in `.env`):
- `HYTALE_WEBSERVER_USERNAME` - Service account username (default: `hyfern`)
- `HYTALE_WEBSERVER_PASSWORD_HASH` - Bcrypt hash of the password
- `PROMETHEUS_USERNAME` - Prometheus scraper username (default: `prometheus`)
- `PROMETHEUS_PASSWORD_HASH` - Bcrypt hash of the Prometheus password

**Generate password hashes:**
```bash
# Hash the HyFern service account password
npx bcryptjs-cli "$(grep '^HYTALE_WEBSERVER_PASSWORD=' .env | cut -d= -f2)"

# Hash the Prometheus password
npx bcryptjs-cli "$(grep '^PROMETHEUS_PASSWORD=' .env | cut -d= -f2)"
```

Add the generated hashes to your `.env` file:
```env
HYTALE_WEBSERVER_PASSWORD_HASH=$2b$10$your_generated_hash_here
PROMETHEUS_PASSWORD_HASH=$2b$10$your_generated_hash_here
```

The entrypoint script will automatically template these values into the service account JSON files on container startup.

### 4. Start everything

```bash
docker compose up -d
```

### 5. Set up Pelican Panel

Visit `https://panel.hyfern.us` and complete the initial setup. Generate API keys for Wings and the frontend (add them to your `.env` and restart).

### 6. Create Initial Admin User

The frontend dashboard requires an admin account. Set these environment variables in your `.env` file:

```env
# Initial admin credentials (used on first database setup)
INIT_ADMIN_USERNAME=admin
INIT_ADMIN_PASSWORD=your-secure-password-here
```

**Important:**
- These credentials are only used to create the initial admin account on first run
- Change the password immediately after first login at `https://hyfern.us/login`
- You can enable 2FA (TOTP) from the settings page for additional security

If you need to reset the admin password later, update these ENV vars and run:
```bash
docker compose run --rm hyfern-frontend npm run reset-admin
docker compose restart hyfern-frontend
```

## Updating the Hytale Server

```bash
./update-server.sh
docker compose restart hytale-server
```

## Authentication

HyFern uses unified authentication across all services:

- **Frontend Dashboard**: NextAuth v5 with JWT sessions
- **Grafana**: Proxy authentication via frontend (no separate password)
- **Pelican Panel**: Separate API key authentication

### Single Sign-On (SSO)

JWT cookies are set on the `.hyfern.us` domain, enabling seamless authentication across:
- `hyfern.us` (main dashboard)
- `grafana.hyfern.us` (monitoring dashboards)

When you log in to the frontend, you're automatically authenticated on Grafana.

### Admin Credentials

Set one admin account via environment variables:
- `INIT_ADMIN_USERNAME` (default: admin)
- `INIT_ADMIN_PASSWORD` (default: admin123)

These credentials work for:
- Frontend dashboard
- Grafana dashboards (via proxy auth)
- All authenticated API endpoints

### Connect Page Access

The `/connect` page shows server connection information:
- **Authenticated users**: Immediate access to connection details
- **Unauthenticated users**: Must enter `SERVER_ACCESS_PASSWORD` to view

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
