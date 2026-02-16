# Hytale Server Pelican Egg

This directory contains the Pelican Panel egg definition for running a Hytale server.

## Contents

- `egg-hytale.yaml` - Pelican Panel egg definition

## Egg Features

- **JVM Settings**: Optimized for 6GB RAM with G1GC garbage collector
- **AOT Cache**: Supports loading HytaleServer.aot for faster startup
- **Auto Installation**: Downloads and installs server files automatically
- **Plugin Configs**: Automatically provisions default configs for:
  - WebServer plugin (port 5523)
  - PerformanceSaver plugin (auto view distance adjustment)

## Default JVM Arguments

```
-Xms2G -Xmx6G 
-XX:+UseG1GC 
-XX:+ParallelRefProcEnabled 
-XX:MaxGCPauseMillis=200 
-XX:+UnlockExperimentalVMOptions 
-XX:+DisableExplicitGC 
-XX:+AlwaysPreTouch 
-XX:+UseLargePages 
-XX:+UseStringDeduplication
```

## Ports

- `5520/udp` - Game server (QUIC protocol)
- `5523/tcp` - WebServer HTTP API

## Usage in Pelican Panel

1. Import `egg-hytale.yaml` into Pelican Panel
2. Create a new server using this egg
3. Server will automatically:
   - Download Hytale server files
   - Copy AOT cache from `/mnt/server/hytale-aot/HytaleServer.aot`
   - Install default plugin configs

## AOT Cache Setup

The AOT cache file should be placed at:
```
data/hytale/HytaleServer.aot
```

This is automatically mounted to the Wings container at:
```
/mnt/server/hytale-aot/HytaleServer.aot
```
