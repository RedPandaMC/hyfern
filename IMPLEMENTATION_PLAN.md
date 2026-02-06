# HyFern Implementation Plan

## Context

Building all deployable code artifacts for HyFern — a Hytale server management dashboard at hyfern.us. The project uses Pelican Panel for container orchestration, a Next.js 15 frontend with multi-user auth, CurseForge mod management, JVM tuning, and a Prometheus/Grafana observability stack. Everything runs in Docker containers behind Caddy reverse proxy.

Development is local. The Docker images will be pulled to the production server when ready.

The hytale-downloader CLI tool is available at `hytale-downloader/` for downloading server files with OAuth2 auth.

---

## Repository Structure

```
hyfern/
├── docker-compose.yml              # Full stack orchestration
├── .env.example                     # Template for all env vars
├── Caddyfile                        # Reverse proxy config
│
├── egg/                             # Pelican Panel egg
│   ├── egg-hytale.json              # Egg definition (JSON)
│   └── Dockerfile                   # Custom Hytale server image (temurin:25-jre)
│
├── frontend/                        # Next.js 15 app
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma            # User, Session, TOTP, InstalledMod models
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx           # Root layout with dark theme, fonts
│   │   │   ├── page.tsx             # Landing page (public server status + login)
│   │   │   ├── login/page.tsx       # Login form
│   │   │   ├── dashboard/page.tsx   # Main dashboard (players, TPS, resources)
│   │   │   ├── console/page.tsx     # xterm.js server console
│   │   │   ├── mods/page.tsx        # CurseForge mod browser + installed mods
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx         # Server config.json editor
│   │   │   │   └── jvm/page.tsx     # JVM flags editor + live metrics
│   │   │   ├── analytics/page.tsx   # Grafana embeds / Recharts
│   │   │   ├── connect/page.tsx     # Password-gated connection info
│   │   │   ├── files/page.tsx       # File manager (Wings API)
│   │   │   ├── backups/page.tsx     # Backup management
│   │   │   └── admin/
│   │   │       └── users/page.tsx   # User CRUD (Owner only)
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── server/
│   │   │   │   ├── query/route.ts       # Proxy to Nitrado:Query
│   │   │   │   ├── power/route.ts       # Start/stop/restart via Wings
│   │   │   │   ├── console/route.ts     # WebSocket proxy to Wings console
│   │   │   │   └── config/route.ts      # Read/write config.json via Wings
│   │   │   ├── mods/
│   │   │   │   ├── search/route.ts      # CurseForge search proxy
│   │   │   │   ├── install/route.ts     # Download + install mod
│   │   │   │   └── installed/route.ts   # List/uninstall installed mods
│   │   │   ├── jvm/route.ts             # Read/write JVM startup vars
│   │   │   ├── users/route.ts           # User CRUD endpoints
│   │   │   ├── files/route.ts           # File manager proxy
│   │   │   └── backups/route.ts         # Backup management proxy
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── layout/
│   │   │   │   ├── sidebar.tsx      # Navigation sidebar
│   │   │   │   ├── header.tsx       # Top bar with live status dot
│   │   │   │   └── dashboard-shell.tsx  # Shared layout wrapper
│   │   │   ├── dashboard/
│   │   │   │   ├── player-list.tsx
│   │   │   │   ├── tps-gauge.tsx
│   │   │   │   ├── resource-charts.tsx
│   │   │   │   └── server-controls.tsx
│   │   │   ├── console/
│   │   │   │   └── terminal.tsx     # xterm.js wrapper
│   │   │   ├── mods/
│   │   │   │   ├── mod-browser.tsx
│   │   │   │   ├── mod-card.tsx
│   │   │   │   └── installed-mods.tsx
│   │   │   ├── settings/
│   │   │   │   ├── config-editor.tsx
│   │   │   │   └── jvm-configurator.tsx
│   │   │   └── auth/
│   │   │       ├── login-form.tsx
│   │   │       └── totp-setup.tsx
│   │   ├── lib/
│   │   │   ├── auth.ts              # NextAuth config
│   │   │   ├── prisma.ts            # Prisma client singleton
│   │   │   ├── wings.ts             # Wings API client
│   │   │   ├── curseforge.ts        # CurseForge API client
│   │   │   ├── query.ts             # Nitrado:Query client
│   │   │   ├── permissions.ts       # Role-based permission checks
│   │   │   └── rate-limit.ts        # Login rate limiting
│   │   ├── hooks/
│   │   │   ├── use-server-status.ts # SWR/polling for Query data
│   │   │   └── use-metrics.ts       # Prometheus metrics hook
│   │   └── types/
│   │       ├── query.ts             # Nitrado:Query response types
│   │       ├── curseforge.ts        # CurseForge API types
│   │       └── server.ts            # Server config types
│   └── Dockerfile                   # Frontend container image
│
├── observability/
│   ├── prometheus/
│   │   └── prometheus.yml           # Scrape config for PrometheusExporter
│   └── grafana/
│       ├── provisioning/
│       │   ├── datasources/
│       │   │   └── prometheus.yml   # Auto-configure Prometheus datasource
│       │   └── dashboards/
│       │       ├── dashboard.yml    # Dashboard provisioning config
│       │       ├── server-overview.json
│       │       ├── performance-deep-dive.json
│       │       ├── player-analytics.json
│       │       └── alerts.json
│       └── grafana.ini              # Grafana config (allow embedding, auth)
│
└── hytale-downloader/               # (existing) Hytale server downloader tool
```

---

## Phase 1: Project Foundation & Infrastructure Configs

### 1.1 Docker Compose (`docker-compose.yml`)

9 services as specified in the architecture:

| Service | Image | Ports | Volumes | Network |
|---------|-------|-------|---------|---------|
| **caddy** | caddy:2-alpine | 80, 443 | caddy_data, Caddyfile | Public |
| **pelican-panel** | Pelican Panel | 8080 (internal) | Panel data, .env | Internal |
| **wings** | Wings daemon | 8443 (internal) | Docker socket, data | Internal |
| **hytale-server** | Custom (temurin:25) | 5520/UDP, 5523/TCP | worlds, mods, configs | 5520 Pub, 5523 Int |
| **hyfern-frontend** | node:22-alpine | 3000 (internal) | App source | Internal |
| **postgresql** | postgres:16 | 5432 (internal) | pg_data | Internal |
| **redis** | redis:7-alpine | 6379 (internal) | redis_data | Internal |
| **prometheus** | prom/prometheus | 9090 (internal) | prom_data, prom.yml | Internal |
| **grafana** | grafana/grafana-oss | 3001 (internal) | grafana_data | Internal |

Two Docker networks: `public` (caddy + hytale-server game port) and `internal` (everything).

Only Caddy (80/443) and port 5520/UDP (game traffic) are exposed to the public internet.

### 1.2 Caddyfile

Reverse proxy entries for:
- `hyfern.us` -> frontend:3000
- `panel.hyfern.us` -> pelican-panel:8080
- `api.hyfern.us` -> wings:8443
- `grafana.hyfern.us` -> grafana:3001

Caddy automatically provisions Let's Encrypt certificates for all domains with zero configuration.

### 1.3 Environment Template (`.env.example`)

All configurable values: DB credentials, Redis URL, NextAuth secret, CurseForge API key, Wings API key, Pelican API key, WebServer service account credentials, server access password, etc.

---

## Phase 2: Pelican Egg & Hytale Server Docker Image

### 2.1 Dockerfile (`egg/Dockerfile`)
- Base: `eclipse-temurin:25-jre`
- Expose 5520/UDP (game QUIC) + 5523/TCP (WebServer HTTP)
- Create directories: `/server`, `/server/mods`
- Copy hytale-downloader for server updates
- Entrypoint: configurable Java startup with JVM flags -> `HytaleServer.jar`

### 2.2 Pelican Egg (`egg/egg-hytale.json`)

Startup variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_MEMORY` | 4G | Heap size (-Xms/-Xmx) |
| `GC_TYPE` | G1GC | Garbage collector (G1GC or ZGC) |
| `MAX_GC_PAUSE` | 200 | Target max GC pause in ms |
| `PARALLEL_REF_PROC` | true | Parallel reference processing |
| `AOT_CACHE` | HytaleServer.aot | Ahead-of-Time compilation cache |
| `BACKUP_ENABLED` | false | Enable built-in Hytale backups |
| `BACKUP_FREQUENCY` | 60 | Backup interval in minutes |
| `CUSTOM_JVM_FLAGS` | (empty) | Additional JVM flags |
| `DISABLE_SENTRY` | false | Disable crash reporting |

### 2.3 Plugin Configs

Default config files for the 4 official plugins:
- `mods/Nitrado_WebServer/config.json` — port 5523, TLS settings
- `mods/Nitrado_WebServer/provisioning/prometheus.serviceaccount.json` — bcrypt password, metrics permission
- `mods/Nitrado_WebServer/provisioning/hyfern.serviceaccount.json` — for API proxy access
- `mods/Nitrado_PerformanceSaver/config.json` — min view radius 6, max from config.json, TPS threshold 25

---

## Phase 3: Observability Stack

### 3.1 Prometheus Config (`observability/prometheus/prometheus.yml`)
- Scrape interval: 15s
- Target: `hytale-server:5523/ApexHosting/PrometheusExporter/metrics`
- Basic auth with service account credentials
- TLS skip verify (self-signed cert)

### 3.2 Grafana Config
- `grafana.ini`: allow embedding (for iframe in frontend), anonymous read for specific org, bind to 3001
- Datasource provisioning: auto-configure Prometheus at `http://prometheus:9090`
- 4 dashboard JSON files:
  1. **Server Overview**: TPS gauge, player count, active chunks, entities
  2. **Performance Deep Dive**: TPS timeline, GC vs TPS correlation, heap trending, view distance tracking
  3. **Player Analytics**: Online count over time, peak hours heatmap
  4. **Alerts**: TPS < 20, heap > 90%, server offline panels

### 3.3 Metrics Reference

| Metric | Type | Use In HyFern |
|--------|------|---------------|
| `hytale_players_online{world}` | Gauge | Player count over time, peak hours heatmap |
| `hytale_chunks_active{world}` | Gauge | Memory pressure indicator |
| `hytale_chunks_loaded{world}` | Counter | Exploration rate, world generation load |
| `hytale_entities_active{world}` | Gauge | Entity overload detection |
| `hytale_world_tps_avg{world}` | Gauge | Core performance indicator (alert < 25) |
| `hytale_world_tps_min{world}` | Gauge | Spike detection — worst-case frame |
| `hytale_server_max_view_radius` | Gauge | Track PerformanceSaver adjustments |
| JVM heap/GC metrics | Various | Memory trends, GC pause correlation |

---

## Phase 4: Frontend Application (Next.js 15)

### 4.1 Project Setup
- Next.js 15 with App Router, TypeScript
- Tailwind CSS with custom dark theme: navy `#0C1222` bg, teal `#00D4AA` accent
- shadcn/ui components (button, card, input, dialog, dropdown, tabs, select, slider, switch, table, badge, toast)
- Fonts: JetBrains Mono (headings), Geist Sans (body)
- Prisma ORM with PostgreSQL

### 4.2 Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  username      String    @unique
  passwordHash  String
  role          Role      @default(VIEWER)
  totpSecret    String?
  totpEnabled   Boolean   @default(false)
  recoveryCodes String[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt    DateTime
  lastActiveAt DateTime @default(now())
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())
}

model InstalledMod {
  id          String   @id @default(cuid())
  curseforgeId Int
  name        String
  slug        String
  version     String
  fileName    String
  installedAt DateTime @default(now())
  installedBy String
  isCore      Boolean  @default(false)
}

model LoginAttempt {
  id        String   @id @default(cuid())
  ipAddress String
  success   Boolean
  createdAt DateTime @default(now())
}

enum Role {
  OWNER
  ADMIN
  MODERATOR
  VIEWER
}
```

### 4.3 Authentication System

- **NextAuth.js v5** with Credentials provider
- Username + bcrypt password login
- Optional TOTP 2FA via `otplib`: QR code setup, 6-digit verification, 10 hashed recovery codes
- JWT in httpOnly cookies, 24h expiry, 2h idle timeout
- Max 3 concurrent sessions per user
- Rate limiting: 5 attempts / 15 min / IP with exponential backoff
- Role-based middleware: Owner > Admin > Moderator > Viewer
- Server access password gate on `/connect`

### 4.4 Roles

| Role | Permissions | Use Case |
|------|-------------|----------|
| **Owner** | Everything: users, server config, JVM flags, backups, console, mods, analytics, file manager | You |
| **Admin** | Server start/stop, console, mods, settings, backups, analytics. No user mgmt or JVM flags. | Trusted co-admins |
| **Moderator** | Console (read + limited commands), server status, player list, analytics (read-only). | In-game mods |
| **Viewer** | Dashboard (read-only), server status, connection info. | Friends |

### 4.5 Pages

| Page | Route | Description + Data Source | Min Role |
|------|-------|--------------------------|----------|
| **Landing** | `/` | Server status card (Query API) + login form. Public. | Public |
| **Dashboard** | `/dashboard` | Live status from Query: player count, player list, TPS gauge. Resource charts from Prometheus. Start/stop/restart via Wings. | Viewer |
| **Console** | `/console` | xterm.js terminal connected to Wings console WebSocket. | Moderator |
| **Mod Manager** | `/mods` | CurseForge browser. Official plugins shown as "Core Plugins" with lock icons. | Admin |
| **Server Settings** | `/settings` | config.json editor. Shows PerformanceSaver effective view distance alongside configured max. | Admin |
| **JVM Config** | `/settings/jvm` | JVM flags editor with presets. Live JVM memory from PrometheusExporter. "Restart Required" banner. | Owner |
| **Analytics** | `/analytics` | Embedded Grafana dashboards or native Recharts. TPS over time, player heatmap, entity/chunk trends. | Moderator |
| **Connection Info** | `/connect` | Password-gated. Server IP, port 5520/UDP, password. Address from Query API. | Viewer |
| **Users** | `/admin/users` | Owner only: CRUD users, assign roles, force 2FA. | Owner |
| **File Manager** | `/files` | Browse server files via Wings file API. | Admin |
| **Backups** | `/backups` | List, create, restore, download world backups. | Admin |

### 4.6 API Routes

All API routes at `/api/*` act as proxies/controllers:

| Route | Purpose |
|-------|---------|
| `/api/server/query` | Proxy to WebServer:5523/Nitrado/Query with service account auth |
| `/api/server/power` | Wings API power actions (start/stop/restart) |
| `/api/server/config` | Read/write config.json via Wings file API |
| `/api/mods/search` | CurseForge API proxy with Redis caching (15min TTL) |
| `/api/mods/install` | Download from CurseForge CDN, validate, write to mods/ |
| `/api/mods/installed` | List/uninstall installed mods from DB |
| `/api/jvm` | Read/write Pelican startup variables |
| `/api/users` | User CRUD (Owner only) |
| `/api/files` | Wings file API proxy |
| `/api/backups` | Wings backup API proxy |

### 4.7 Key Libraries

| Package | Purpose |
|---------|---------|
| `next-auth@5` | Authentication |
| `@prisma/client` + `prisma` | Database ORM |
| `bcryptjs` | Password hashing |
| `otplib` + `qrcode` | TOTP 2FA |
| `xterm` + `@xterm/addon-fit` + `@xterm/addon-web-links` | Terminal emulator |
| `recharts` | Charts and graphs |
| `swr` | Data fetching/polling |
| `ioredis` | Redis client for CurseForge cache |
| `tailwindcss` | Styling |
| shadcn/ui | Component library |

---

## Phase 5: JVM Configuration Dashboard

Built as part of Phase 4 at `/settings/jvm`. Key implementation details:

- Slider components for memory (1G-32G range, 1G steps)
- Radio group for GC selection (mutually exclusive G1GC/ZGC)
- Validation: -Xmx cannot exceed container RAM limit, -Xms <= -Xmx
- Preset buttons populate all fields at once
- Save writes to Pelican API startup variables -> "Restart Required" banner

### Presets

| Preset | Flags | Best For |
|--------|-------|----------|
| **Casual** | -Xms4G -Xmx4G -XX:+UseG1GC -XX:AOTCache=HytaleServer.aot | 1-5 players |
| **Community** | -Xms6G -Xmx6G -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:AOTCache=HytaleServer.aot | 5-20 players |
| **Performance** | -Xms8G -Xmx8G -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=150 -XX:G1HeapRegionSize=16M -XX:AOTCache=HytaleServer.aot | 20-50 players |
| **Ultra** | -Xms16G -Xmx16G -XX:+UseZGC -XX:AOTCache=HytaleServer.aot | 50+ players |

### Live Metrics Panel

Pulls from Prometheus HTTP API:
- Current heap used vs. allocated (-Xmx) — gauge chart showing percentage
- GC pause frequency and duration over last hour — line chart
- TPS (current, avg, min, max) — color coded (green >28, yellow >20, red <20)
- Effective view distance (PerformanceSaver) vs. configured max — side-by-side
- Active chunks and entities — context for memory usage

---

## Phase 6: CurseForge Mod Manager

Built as part of Phase 4 at `/mods`. Key details:

- CurseForge API client with API key from env
- Redis caching layer: 15-min TTL search results, 1-hour mod details
- Search with filters: game version, category, sort by (popularity, date, name)
- Core plugins (WebServer, Query, PerformanceSaver, PrometheusExporter) shown as locked
- Install flow: CurseForge CDN download -> validate file -> Wings file API write to mods/
- InstalledMod DB table tracks what's installed, who installed it, version
- Update checking: compare installed version vs CurseForge latest
- Dependency resolver: warn if required mods missing

---

## Phase 7: Polish, Testing & Launch

1. End-to-end testing: full user journey from login through mod install, JVM tuning, analytics
2. Verify all four official plugins load and feed data to Query proxy and Prometheus
3. Security audit: CSRF, SQL injection, API key storage, service account credentials, sessions
4. Mobile responsiveness for dashboard
5. Configure Uptime Kuma or similar for health checks

---

## Implementation Order

Build sequentially, each step producing working files:

1. **Docker Compose + Caddyfile + .env.example** — infrastructure foundation
2. **Pelican egg + Hytale server Dockerfile** — server container definition
3. **Observability configs** — Prometheus + Grafana configs and dashboards
4. **Next.js project initialization** — scaffold with Tailwind, shadcn/ui, Prisma, NextAuth
5. **Database schema + auth system** — Prisma models, NextAuth config, 2FA, rate limiting
6. **Layout + shared components** — sidebar, header, dashboard shell, theme
7. **Dashboard page** — Query proxy API route, player list, TPS gauge, resource charts
8. **Console page** — xterm.js + Wings WebSocket
9. **Settings pages** — config editor + JVM configurator with presets and live metrics
10. **Mod manager** — CurseForge client, search, install, installed mods tracking
11. **Remaining pages** — analytics, connect, users, files, backups
12. **Frontend Dockerfile** — containerize the Next.js app

---

## Design Direction

Dark, industrial-futuristic theme:
- **Background**: Deep navy `#0C1222`
- **Accent**: Teal-green `#00D4AA`
- **Headings font**: JetBrains Mono
- **Body font**: Geist Sans
- **Layout**: All pages share sidebar + header layout with live server status indicator

---

## Data Pipelines

### Pipeline 1: Live Dashboard Data (Query)

Frontend polls Nitrado:Query for real-time game state:

| Dashboard Element | Query API Field | Polling Interval |
|-------------------|-----------------|------------------|
| Server status | Basic.Name, Basic.Version, Basic.MaxPlayers | 10 seconds |
| Player count | Basic.CurrentPlayers or Universe.CurrentPlayers | 5 seconds |
| Player list | Players[] (Name, UUID, World per player) | 10 seconds |
| Connection info | Server.Address, Server.ProtocolVersion | On page load |
| Plugin health | Plugins{} (Version, Loaded, Enabled, State) | 30 seconds |

The frontend's Next.js API route acts as a proxy: calls WebServer on port 5523 (internal Docker network), authenticates with a service account, returns sanitized JSON to the browser.

### Pipeline 2: Metrics & Observability (Prometheus)

PrometheusExporter feeds time-series data into Prometheus, which Grafana visualizes. The frontend embeds Grafana dashboards or queries Prometheus HTTP API directly for native Recharts rendering.

---

## Plugin Dependency Chain

```
Nitrado:WebServer <- Nitrado:Query (depends on WebServer)
Nitrado:WebServer <- ApexHosting:PrometheusExporter (depends on WebServer)
Nitrado:PerformanceSaver (standalone, no dependencies)
```

WebServer is the foundation. Query and PrometheusExporter depend on it. PerformanceSaver is standalone.

---

## Verification

After implementation, verify locally:
1. `docker compose config` — validates compose file syntax
2. `cd frontend && npm run build` — confirms Next.js builds without errors
3. `cd frontend && npx prisma generate` — confirms schema is valid
4. `npx prisma validate` — validates Prisma schema
5. All TypeScript compiles cleanly (`npm run lint`)
6. Grafana dashboard JSONs are valid (JSON parse check)
7. Prometheus config is valid YAML
8. Egg JSON is valid Pelican egg format
