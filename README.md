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

The Pelican Panel is automatically deployed via Docker. On first startup, the database will be initialized and you'll need to complete the web-based setup wizard.

#### 5.1 Environment Setup

Ensure these environment variables are set in your `.env` file before starting:

```env
PELICAN_APP_URL=https://panel.hyfern.us
PELICAN_APP_KEY=base64:YOUR_GENERATED_KEY_HERE
REDIS_PASSWORD=your_redis_password
```

Generate the `APP_KEY`:
```bash
# Generate a new key (run this on any system with PHP installed)
php -r "echo 'base64:' . base64_encode(random_bytes(32));"

# Or use OpenSSL
openssl rand -base64 32
```

**Important:** Back up your `APP_KEY`! It encrypts all sensitive data. If lost, encrypted data (API keys, passwords) will be irrecoverable.

#### 5.2 Start the Services

```bash
docker compose up -d pelican-panel
```

Wait for the container to initialize (check logs with `docker compose logs -f pelican-panel`).

#### 5.3 Complete Web Setup

Visit `https://panel.hyfern.us/installer` and complete the setup wizard:

1. **Database**: Select **SQLite** (default - no configuration needed)
2. **Redis**: Already configured via environment variables
3. **Email**: Configure SMTP or use log driver for testing
4. **Create Admin Account**: Set up your first admin user

**Troubleshooting:**

If you see a **login screen** instead of the setup wizard, or get an **HTTP 500 error** when logging in:

1. **Check if database is initialized:**
   ```bash
   docker compose logs pelican-panel | grep -i "database\|error\|500"
   ```

2. **If you see a login screen (database already exists):**
   
   The Pelican database was already initialized, but no admin user exists. You need to either:
   
   **Option A - Reset and start fresh (RECOMMENDED):**
   ```bash
   # This will backup and reset the Pelican database
   ./scripts/reset-pelican.sh
   ```
   Then visit `https://panel.hyfern.us/installer` again.
   
   **Option B - Create admin via CLI (if you want to keep existing data):**
   ```bash
   # First complete the web setup wizard if you haven't already
   # Then run this to create an admin user:
   ./scripts/create-pelican-admin.sh
   ```

3. **If you still get HTTP 500 errors:**
   - Check that `PELICAN_APP_KEY` is properly formatted (must start with `base64:`)
   - Verify Redis is running: `docker compose ps redis`
   - Check Pelican logs: `docker compose logs -f pelican-panel`
   - Ensure file permissions are correct:
     ```bash
     docker compose exec pelican-panel chown -R www-data:www-data /var/www/html/storage
     docker compose exec pelican-panel chown -R www-data:www-data /var/www/html/bootstrap/cache
     ```

#### 5.4 Configure Wings (Node Daemon)

After Pelican Panel is set up, you need to configure Wings:

1. **Create a Node** in Pelican Panel:
   - Go to **Admin Panel** → **Nodes** → **Create New**
   - Set the FQDN to your domain (e.g., `panel.hyfern.us`)
   - Choose **HTTP** or **HTTPS** (must match your panel URL)
   - Save the node

2. **Get Configuration**:
   - Click on your newly created node
   - Go to the **Configuration** tab
   - Copy the configuration code block

3. **Configure Wings in Docker**:
   The Wings configuration is automatically generated on startup. Create the config file:
   ```bash
   mkdir -p ./wings-config
   ```
   
   Create `./wings-config/config.yml` with the configuration from the Panel:
   ```yaml
   debug: false
   uuid: your-node-uuid-from-panel
   token_id: your-token-id
   token: your-token
   api:
     host: 0.0.0.0
     port: 8443
     ssl:
       enabled: false
       certificate: /etc/pelican/certs/certificate.pem
       key: /etc/pelican/certs/certificate.key
   system:
     data: /var/lib/pelican
     sftp:
       bind_address: 0.0.0.0
       bind_port: 2022
   docker:
     network:
       interface: 172.20.0.1
       gateway: 172.20.0.1
       subnet: 172.20.0.0/16
       name: pelican0
   ```

4. **Start Wings**:
   ```bash
   docker compose up -d wings
   ```

#### 5.5 Generate API Keys for HyFern Frontend

The HyFern frontend needs API access to manage servers:

1. **Create Application API Key**:
   - Go to **Admin Panel** → **Application API**
   - Click **Create New**
   - Select these permissions:
     - `nodes.view`, `nodes.deploy`
     - `servers.view`, `servers.control`, `servers.create`, `servers.delete`
     - `users.view`
   - Copy the key to your `.env` as `PELICAN_API_KEY`

2. **Add Frontend as Application** (for Wings API):
   - Go to **Admin Panel** → **Applications**
   - Click **Create New**
   - Name: `HyFern Frontend`
   - Copy the key to your `.env` as `WINGS_API_KEY`

3. **Get Server UUID**:
   - Go to **Admin Panel** → **Servers**
   - Create or select your Hytale server
   - Copy the **UUID** to your `.env` as `PELICAN_SERVER_UUID` and `WINGS_SERVER_UUID`

4. **Restart services**:
   ```bash
   docker compose restart hyfern-frontend wings
   ```

#### 5.6 Verification

Test the integration:
```bash
# Check Pelican Panel health
curl -I https://panel.hyfern.us

# Check Wings health (from within the internal network)
docker compose exec hyfern-frontend curl http://wings:8443
```

**Note:** Pelican Panel uses its own user database separate from the HyFern frontend. The admin account you create during setup is only for Pelican Panel management.

**Reference:** For detailed troubleshooting, see the [Pelican Documentation](https://pelican.dev/docs/)

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
