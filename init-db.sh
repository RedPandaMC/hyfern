#!/bin/bash
# PostgreSQL initialization script for HyFern
# This runs as the POSTGRES_USER (hyfern) which is the superuser
# Docker postgres runs .sh files with proper env var access

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create application databases
    CREATE DATABASE pelican;
    CREATE DATABASE hyfern_frontend;

    -- Create application users
    CREATE USER pelican WITH PASSWORD '${PELICAN_DB_PASSWORD}';
    CREATE USER hyfern_frontend WITH PASSWORD '${FRONTEND_DB_PASSWORD}';

    -- Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE pelican TO pelican;
    GRANT ALL PRIVILEGES ON DATABASE hyfern_frontend TO hyfern_frontend;
EOSQL

# Grant schema access (required for Prisma migrations)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "hyfern_frontend" <<-EOSQL
    GRANT ALL ON SCHEMA public TO hyfern_frontend;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "pelican" <<-EOSQL
    GRANT ALL ON SCHEMA public TO pelican;
EOSQL
