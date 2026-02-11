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

# Grant schema access and create tables for hyfern_frontend
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "hyfern_frontend" <<-EOSQL
    GRANT ALL ON SCHEMA public TO hyfern_frontend;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hyfern_frontend;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hyfern_frontend;

    -- Create HyFern frontend tables (matches Prisma schema)

    -- Role enum
    CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'VIEWER');

    -- Users table
    CREATE TABLE users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        "passwordHash" TEXT NOT NULL,
        role "Role" NOT NULL DEFAULT 'VIEWER',
        "totpSecret" TEXT,
        "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
        "recoveryCodes" TEXT[] DEFAULT '{}',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Sessions table
    CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX sessions_userId_idx ON sessions("userId");
    CREATE INDEX sessions_expiresAt_idx ON sessions("expiresAt");

    -- Installed mods table
    CREATE TABLE installed_mods (
        id TEXT PRIMARY KEY,
        "curseforgeId" INTEGER UNIQUE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        version TEXT NOT NULL,
        "fileName" TEXT UNIQUE NOT NULL,
        "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "installedBy" TEXT NOT NULL REFERENCES users(id),
        "isCore" BOOLEAN NOT NULL DEFAULT false
    );
    CREATE INDEX installed_mods_slug_idx ON installed_mods(slug);
    CREATE INDEX installed_mods_installedAt_idx ON installed_mods("installedAt");

    -- Login attempts table (rate limiting)
    CREATE TABLE login_attempts (
        id TEXT PRIMARY KEY,
        "ipAddress" TEXT NOT NULL,
        success BOOLEAN NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX login_attempts_ipAddress_createdAt_idx ON login_attempts("ipAddress", "createdAt");
    CREATE INDEX login_attempts_createdAt_idx ON login_attempts("createdAt");

    -- Grant ownership to hyfern_frontend user
    ALTER TABLE users OWNER TO hyfern_frontend;
    ALTER TABLE sessions OWNER TO hyfern_frontend;
    ALTER TABLE installed_mods OWNER TO hyfern_frontend;
    ALTER TABLE login_attempts OWNER TO hyfern_frontend;
    ALTER TYPE "Role" OWNER TO hyfern_frontend;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "pelican" <<-EOSQL
    GRANT ALL ON SCHEMA public TO pelican;
EOSQL
