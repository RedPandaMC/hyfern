-- Create databases for Pelican Panel and HyFern Frontend
CREATE DATABASE pelican;
CREATE DATABASE hyfern_frontend;

-- Create users with passwords from environment variables
-- Note: In production, these will be created with actual passwords from .env
-- This is just a template - actual setup requires running with env vars

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE pelican TO pelican;
GRANT ALL PRIVILEGES ON DATABASE hyfern_frontend TO hyfern_frontend;
