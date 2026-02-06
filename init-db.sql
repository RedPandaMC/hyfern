-- PostgreSQL initialization script for HyFern
-- This runs as the POSTGRES_USER (hyfern) which is the superuser

-- Create application databases
CREATE DATABASE pelican;
CREATE DATABASE hyfern_frontend;

-- Create application users
-- Passwords are injected via environment variables in docker-compose
CREATE USER pelican WITH PASSWORD :'PELICAN_DB_PASSWORD';
CREATE USER hyfern_frontend WITH PASSWORD :'FRONTEND_DB_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE pelican TO pelican;
GRANT ALL PRIVILEGES ON DATABASE hyfern_frontend TO hyfern_frontend;

-- Grant schema access (required for Prisma migrations)
\c hyfern_frontend
GRANT ALL ON SCHEMA public TO hyfern_frontend;

\c pelican
GRANT ALL ON SCHEMA public TO pelican;
