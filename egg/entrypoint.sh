#!/bin/bash
set -e

# Ensure required directories exist (bind mount may be empty on first run)
mkdir -p /server/mods /server/logs

# Copy default plugin configs if not already present
if [ -d "/opt/default-configs" ]; then
    for dir in /opt/default-configs/*/; do
        plugin_name=$(basename "$dir")
        if [ ! -d "/server/mods/$plugin_name" ]; then
            echo "Provisioning default config for $plugin_name..."
            cp -r "$dir" "/server/mods/$plugin_name"
        fi
    done
fi

# Check that server jar exists (should be extracted to server-data/ on the host)
if [ ! -f "/server/HytaleServer.jar" ]; then
    echo "ERROR: HytaleServer.jar not found at /server/HytaleServer.jar"
    echo ""
    echo "To set up the server:"
    echo "  1. Run: cd hytale-downloader && ./hytale-downloader-linux-amd64"
    echo "  2. Extract: unzip -o <downloaded>.zip -d ../server-data/"
    echo "  3. Move: mv ../server-data/Server/* ../server-data/ && rm -r ../server-data/Server"
    echo "  4. Restart: docker compose up -d hytale-server"
    exit 1
fi

# Build JVM command
JVM_ARGS="-Xms${SERVER_MEMORY} -Xmx${SERVER_MEMORY}"

# GC configuration
if [ "$GC_TYPE" = "ZGC" ]; then
    JVM_ARGS="$JVM_ARGS -XX:+UseZGC"
    JVM_ARGS="$JVM_ARGS -XX:ZCollectionInterval=5"
    JVM_ARGS="$JVM_ARGS -XX:ZFragmentationLimit=10"
elif [ "$GC_TYPE" = "G1GC" ]; then
    JVM_ARGS="$JVM_ARGS -XX:+UnlockExperimentalVMOptions"
    JVM_ARGS="$JVM_ARGS -XX:+UseG1GC"
    JVM_ARGS="$JVM_ARGS -XX:MaxGCPauseMillis=${MAX_GC_PAUSE}"
    JVM_ARGS="$JVM_ARGS -XX:G1HeapRegionSize=16M"
    JVM_ARGS="$JVM_ARGS -XX:G1NewSizePercent=30"
    JVM_ARGS="$JVM_ARGS -XX:G1MaxNewSizePercent=40"
    JVM_ARGS="$JVM_ARGS -XX:G1ReservePercent=15"
    JVM_ARGS="$JVM_ARGS -XX:InitiatingHeapOccupancyPercent=40"
fi

# ParallelRefProc
if [ "$PARALLEL_REF_PROC" = "true" ]; then
    JVM_ARGS="$JVM_ARGS -XX:+ParallelRefProcEnabled"
fi

# AOT cache (JDK 25+ uses -XX:AOTCache, not -XX:AOTLibrary)
if [ -n "$AOT_CACHE" ] && [ -f "/server/${AOT_CACHE}" ]; then
    JVM_ARGS="$JVM_ARGS -XX:AOTCache=${AOT_CACHE}"
fi

# Performance flags
JVM_ARGS="$JVM_ARGS -XX:+AlwaysPreTouch"
JVM_ARGS="$JVM_ARGS -XX:+DisableExplicitGC"
JVM_ARGS="$JVM_ARGS -XX:+UseStringDeduplication"

# Sentry
if [ "$DISABLE_SENTRY" = "true" ]; then
    JVM_ARGS="$JVM_ARGS -Dsentry.dsn="
fi

# Logging
JVM_ARGS="$JVM_ARGS -Xlog:gc*:file=/server/logs/gc.log:time,uptime:filecount=5,filesize=10M"

# Custom flags
if [ -n "$CUSTOM_JVM_FLAGS" ]; then
    JVM_ARGS="$JVM_ARGS $CUSTOM_JVM_FLAGS"
fi

# Start server
echo "Starting Hytale server with JVM args: $JVM_ARGS"
exec java $JVM_ARGS -jar /server/HytaleServer.jar nogui
