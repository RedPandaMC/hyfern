# Hytale Server Docker Image & Pelican Egg

This directory contains the Docker image definition and Pelican Panel egg for running a Hytale server.

## Contents

- `Dockerfile` - Custom Hytale server image based on `eclipse-temurin:25-jre`
- `entrypoint.sh` - Startup script that constructs JVM arguments
- `egg-hytale.json` - Pelican Panel egg definition with startup variables
- `default-configs/` - Default configuration files for official plugins

## Building the Image

```bash
docker build -t hyfern/hytale-server:latest .
```

## Plugin Configuration

### Nitrado:WebServer

The WebServer plugin exposes an HTTP API on port 5523 (TCP) for:
- Query API (live server status)
- Console access
- Configuration management

**Service Accounts:**
- `prometheus` - For Prometheus metrics scraping (read-only)
- `hyfern` - For dashboard API access (read/write)

**Note:** Before first run, you must replace `$2a$10$REPLACE_WITH_BCRYPT_HASH` in the service account JSON files with actual bcrypt hashes of the passwords from your `.env` file.

Generate bcrypt hashes with:
```bash
# Install bcrypt tool
npm install -g bcrypt-cli

# Generate hash
bcrypt-cli "your-password-here"
```

### Nitrado:PerformanceSaver

Automatically adjusts view distance based on server TPS:
- Minimum view distance: 6 chunks
- Maximum view distance: reads from `config.json` (default 32)
- TPS threshold: 25 (adjusts down when TPS drops below this)
- Check interval: 5 seconds

## JVM Presets

The egg supports four JVM tuning presets via the HyFern dashboard:

1. **Casual** (4GB RAM, G1GC, 200ms pause)
2. **Community** (8GB RAM, G1GC, 150ms pause)
3. **Performance** (16GB RAM, ZGC)
4. **Ultra** (32GB RAM, ZGC, max optimizations)

These presets configure the startup variables in the Pelican egg.

## Ports

- `5520/udp` - Game server (QUIC protocol)
- `5523/tcp` - WebServer HTTP API (internal only, accessed via frontend)
