#!/bin/bash
set -e

# Download Hytale server if not present
if [ ! -f "/server/HytaleServer.jar" ]; then
    echo "Downloading Hytale server..."
    hytale-downloader -download-path /server/HytaleServer.jar
fi

# Build JVM command
JVM_ARGS="-Xms${SERVER_MEMORY} -Xmx${SERVER_MEMORY}"

# GC configuration
if [ "$GC_TYPE" = "ZGC" ]; then
    JVM_ARGS="$JVM_ARGS -XX:+UseZGC"
    JVM_ARGS="$JVM_ARGS -XX:ZCollectionInterval=5"
    JVM_ARGS="$JVM_ARGS -XX:ZFragmentationLimit=10"
elif [ "$GC_TYPE" = "G1GC" ]; then
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

# AOT cache
if [ -n "$AOT_CACHE" ]; then
    JVM_ARGS="$JVM_ARGS -XX:AOTLibrary=${AOT_CACHE}"
fi

# Performance flags
JVM_ARGS="$JVM_ARGS -XX:+AlwaysPreTouch"
JVM_ARGS="$JVM_ARGS -XX:+DisableExplicitGC"
JVM_ARGS="$JVM_ARGS -XX:+UseStringDeduplication"
JVM_ARGS="$JVM_ARGS -XX:+UseFastAccessorMethods"

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
exec java $JVM_ARGS -jar HytaleServer.jar nogui
