# HyFern - Deployment

This branch contains only the files needed to deploy HyFern. No application source code is included — the frontend is pulled from [DockerHub](https://hub.docker.com/r/redpandamc/hyfern-frontend).

For the full source code, see the [main branch](https://github.com/RedPandaMC/hyfern/tree/main).

## Prerequisites

- Linux server with Docker and Docker Compose
- A domain pointing to your server (default: `hyfern.us` + subdomains)
- A Hytale account with server access

## Setup

### 1. Clone this branch

```bash
git clone -b setup https://github.com/RedPandaMC/hyfern.git
cd hyfern
```

### 2. Configure environment

```bash
cp .env.example .env
nano .env  # Fill in all values
```

### 3. Download the Hytale server

```bash
./update-server.sh
```

First run will open a browser-based OAuth login. Subsequent runs reuse saved credentials.

### 4. Hash WebServer plugin passwords

Generate bcrypt hashes for the passwords in your `.env`:

```bash
npx bcryptjs-cli "your-HYTALE_WEBSERVER_PASSWORD-here"
```

Update the hashes in:
- `server-data/mods/Nitrado_WebServer/provisioning/hyfern.serviceaccount.json`
- `server-data/mods/Nitrado_WebServer/provisioning/prometheus.serviceaccount.json`

### 5. Start

```bash
docker compose up -d
```

### 6. Set up Pelican Panel

Visit `https://panel.hyfern.us`, complete initial setup, and generate API keys for Wings and the frontend. Add them to `.env` and restart:

```bash
docker compose up -d
```

## Updating

### Hytale server

```bash
./update-server.sh
docker compose restart hytale-server
```

### Frontend

```bash
docker compose pull hyfern-frontend
docker compose up -d hyfern-frontend
```

## What's included

```
.env.example               # Environment variable template
Caddyfile                  # Reverse proxy (auto HTTPS)
docker-compose.yml         # All 9 services
init-db.sh                 # PostgreSQL database initialization
update-server.sh           # Hytale server download/update
egg/                       # Hytale server Docker image
observability/             # Prometheus + Grafana configs
server-data/               # Hytale server files (created by update-server.sh)
```

## License

MIT
