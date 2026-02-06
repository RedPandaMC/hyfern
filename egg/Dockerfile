FROM eclipse-temurin:25-jre

# Set working directory
WORKDIR /server

# Install dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create necessary directories
RUN mkdir -p /server/mods \
    /server/mods/Nitrado_WebServer/provisioning \
    /server/mods/Nitrado_PerformanceSaver \
    /server/logs

# Copy hytale-downloader for server updates
COPY --chmod=755 ../hytale-downloader/hytale-downloader-linux-amd64 /usr/local/bin/hytale-downloader

# Expose game port (UDP) and WebServer HTTP port (TCP)
EXPOSE 5520/udp 5523/tcp

# Health check via WebServer HTTP endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5523/health || exit 1

# Default environment variables (overridden by docker-compose)
ENV SERVER_MEMORY=4G \
    GC_TYPE=G1GC \
    MAX_GC_PAUSE=200 \
    PARALLEL_REF_PROC=true \
    AOT_CACHE=HytaleServer.aot \
    BACKUP_ENABLED=false \
    BACKUP_FREQUENCY=60 \
    CUSTOM_JVM_FLAGS="" \
    DISABLE_SENTRY=false

# Entrypoint script to construct JVM command
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
