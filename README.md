# HyFern

A self-hosted Hytale server management dashboard. Manage your server, mods, backups, JVM settings, and monitor performance — all from a single web interface.

## Features

- **Server Management**: Start, stop, and restart your Hytale server
- **Real-time Console**: View live server logs and output
- **Mod Management**: Browse and install Hytale mods via CurseForge integration
- **Performance Monitoring**: Real-time TPS, memory, CPU metrics via Grafana
- **JVM Configuration**: Fine-tune garbage collection, memory allocation via dashboard
- **Server Configuration**: Edit server name, MOTD, max players, view distance
- **Backup System**: Automated backups with configurable retention
- **Role-based Access**: OWNER, ADMIN, MODERATOR, and VIEWER permission levels
- **Two-Factor Authentication**: TOTP-based 2FA with recovery codes
- **Unified Login**: Single sign-on across frontend and Grafana

## Architecture

| Service | Description | Port |
|---------|-------------|------|
| **Frontend** | Next.js dashboard | 3000 (internal) |
| **Hytale Server** | Java 21 container with Eclipse Temurin | 5520/UDP, 5523 |
| **Caddy** | Reverse proxy with automatic HTTPS | 80, 443 |
| **Redis** | Caching and rate limiting | 6379 (internal) |
| **Prometheus** | Metrics collection | 9090 (internal) |
| **Grafana** | Metrics dashboards | 3001 (internal) |

## Prerequisites

- Linux server with Docker and Docker Compose
- A domain pointing to your server
- ~10GB+ disk space for server files and mods
- 8GB+ RAM recommended

## Quick Start

### 1. Clone and Configure

```bash
git clone https://github.com/RedPandaMC/hyfern.git
cd hyfern
cp .env.example .env
nano .env
```

### 2. Download Hytale Server Files

See [Download Guide](#download-guide) below for instructions on obtaining Hytale server files.

Place your server files in `data/hytale/` so that:
- `data/hytale/HytaleServer.jar` exists
- `data/hytale/HytaleServer.aot` exists (if using AOT cache)

### 3. Start Services

```bash
docker compose up -d
```

Wait for services to become healthy:
```bash
docker compose ps
# All should show "healthy" status
```

### 4. Access the Dashboard

- **Frontend**: https://hyfern.us
- **Grafana**: https://grafana.hyfern.us (uses frontend authentication)

Default login:
- Username: `admin`
- Password: `admin123` (change immediately!)

---

## Installation Guide

### Environment Variables

Create a `.env` file with the following variables:

```bash
# General
TZ=UTC
LETSENCRYPT_EMAIL=your-email@example.com

# Frontend
NEXTAUTH_URL=https://hyfern.us
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
SERVER_ACCESS_PASSWORD=your_secure_password

# Redis
REDIS_PASSWORD=your_secure_redis_password

# Hytale Server (Java Container)
HYTALE_MEMORY=4G
HYTALE_MAX_MEMORY=6G
HYTALE_GC=G1GC
HYTALE_MAX_GC_PAUSE=200

# Hytale WebServer Plugin
HYTALE_WEBSERVER_USERNAME=hyfern
HYTALE_WEBSERVER_PASSWORD=your_webserver_password

# Monitoring
PROMETHEUS_PASSWORD=your_prometheus_password
GRAFANA_ROOT_URL=https://grafana.hyfern.us
GRAFANA_ADMIN_PASSWORD=your_grafana_password
```

Generate secrets:
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# Passwords
openssl rand -hex 32
```

### Network Requirements

Ensure these ports are open:
- **80, 443**: HTTP/HTTPS (Caddy)
- **5520/UDP**: Hytale game traffic
- **5523/TCP**: Hytale WebServer API

---

## Download Guide

### Getting Hytale Server Files

Hytale server files must be obtained through official channels:

1. **Via Hytale Launcher**:
   - Download and install the Hytale launcher
   - The server files are included with the game files
   - Location: `C:\Program Files\Hytale Game\hytale-server` (Windows)
   - On Mac/Linux: Check your Hytale installation directory

2. **Via Your Server Provider**:
   - Many Hytale server hosts provide pre-downloaded server files
   - Contact your provider for access

### Required Files

Place these files in `data/hytale/`:

```
data/hytale/
├── HytaleServer.jar          # Main server JAR (required)
├── HytaleServer.aot          # AOT cache file (recommended)
├── mods/                     # Your mods folder
│   └── (mod files here)
├── config/
│   └── config.json           # Server configuration
└── backups/                  # Backup storage (auto-created)
```

### Mod Installation

1. **Manual**: Place mod files in `data/hytale/mods/`
2. **Via Dashboard**: Use the Mods page to browse and install from CurseForge

### WebServer Plugin

The Hytale WebServer plugin is required for:
- Live console viewing
- Server status monitoring
- REST API access

Ensure your Hytale server has the WebServer plugin installed and configured with matching credentials from your `.env` file.

---

## Configuration

### JVM Settings

Access via **Settings → JVM Configuration** in the dashboard.

Available options:
- **Memory**: Min/Max heap size (1-32GB)
- **GC Type**: G1GC (default) or ZGC
- **Max GC Pause**: Target pause time (50-1000ms)
- **Custom Flags**: Additional JVM arguments

### Server Configuration

Access via **Settings → Server Config** in the dashboard.

Options:
- **Server Name**: Display name
- **MOTD**: Message of the day
- **Max Players**: Player limit (1-100)
- **Max View Radius**: Chunk view distance (6-64)
- **Password**: Server password (optional)

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HYTALE_MEMORY` | 4G | Initial JVM heap |
| `HYTALE_MAX_MEMORY` | 6G | Maximum JVM heap |
| `HYTALE_GC` | G1GC | Garbage collector |
| `HYTALE_SERVER_PORT` | 5520 | Game traffic port |
| `HYTALE_WEBSERVER_PORT` | 5523 | Web API port |

---

## Project Structure

```
.
├── Caddyfile              # Reverse proxy config
├── docker-compose.yml     # All services
├── .env.example           # Environment template
├── data/                  # Data directories
│   ├── hytale/           # Hytale server files
│   ├── database/         # SQLite database
│   ├── grafana/          # Grafana data
│   ├── prometheus/       # Metrics data
│   └── redis/            # Redis data
├── frontend/             # Next.js dashboard
│   ├── app/              # Pages and API routes
│   ├── components/       # UI components
│   └── lib/              # Utilities
└── observability/        # Monitoring config
    ├── grafana/          # Grafana dashboards
    └── prometheus/       # Prometheus config
```

---

## Ports

| Port | Protocol | Service |
|------|----------|---------|
| 80 | TCP | Caddy HTTP |
| 443 | TCP | Caddy HTTPS |
| 5520 | UDP | Hytale game |
| 5523 | TCP | Hytale WebServer |

All other services communicate internally via Docker networks.

---

## Troubleshooting

### Server Won't Start

1. Check that Hytale server files are in `data/hytale/`
2. Verify permissions: `ls -la data/hytale/`
3. Check container logs: `docker compose logs hytale-server`

### Can't Connect to Server

1. Verify the server is running in dashboard
2. Check port 5520/UDP is open in firewall
3. Check container logs for errors

### Dashboard Shows Errors

```bash
# Check frontend logs
docker compose logs hyfern-frontend

# Restart services
docker compose restart
```

### Permission Issues

```bash
# Fix data directory permissions
sudo chown -R 1001:1001 data/hytale data/database
```

---

## Building from Source

### Build Frontend

```bash
cd frontend
npm install
npm run build
docker build -t your-dockerhub-user/hyfern-frontend:latest .
docker push your-dockerhub-user/hyfern-frontend:latest
```

---

## License

MIT
