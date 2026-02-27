# Deployment Summary - Bug Fixes

## Changes Made

### 1. Profile Picture Viewer (✅ Fixed)
**Files Modified:**
- `frontend/app/profile/profile-content.tsx`

**Changes:**
- Added a dialog component to view profile pictures in full size
- Clicking on the avatar now opens a lightbox viewer
- Added close button (X) in the top-right corner
- Upload functionality preserved via hover overlay

### 2. Avatar Upload Rate Limiting (✅ Added)
**Files Created:**
- `frontend/lib/redis.ts` - Redis client and rate limiting functions

**Files Modified:**
- `frontend/app/api/profile/avatar/route.ts`

**Changes:**
- Added Redis-based rate limiting: 1 avatar upload per day per user
- Rate limit resets 24 hours after the first upload
- Returns HTTP 429 with time remaining if limit exceeded
- Gracefully falls back if Redis is unavailable

### 3. Pelican Database Initialization (✅ Fixed)
**Files Created:**
- `scripts/init-pelican-db.sh` - Database initialization script
- `scripts/Dockerfile.pelican-init` - Docker image for init container

**Files Modified:**
- `docker-compose.yml` - Added pelican-db-init service

**Changes:**
- New `pelican-db-init` service runs before pelican-panel
- Automatically creates empty SQLite database file if it doesn't exist
- Sets correct permissions (www-data user)

### 4. Light Mode Background (✅ Fixed)
**Files Modified:**
- `frontend/components/layout/dashboard-shell.tsx`

**Changes:**
- Increased opacity in light mode: `bg-background/80` (was 50%)
- Reduced blur effect: `backdrop-blur-[2px]` (was `backdrop-blur-sm`)
- Dark mode remains at 50% opacity

## Deployment Instructions

### 1. Pull Latest Code
```bash
cd /home/hyfern-admin/hyfern
git pull origin main
```

### 2. Deploy with Docker Compose
```bash
# Stop existing containers
docker-compose down

# Build and start all services
docker-compose up --build -d
```

### 3. Verify Services
```bash
# Check all services are running
docker-compose ps

# Check pelican-panel logs
docker-compose logs -f pelican-panel

# Check frontend logs
docker-compose logs -f hyfern-frontend
```

### 4. Access Panel Installer
Once services are healthy:
- Navigate to https://panel.hyfern.us/installer
- Complete the Pelican Panel installation
- Import the custom egg: Admin → Nests → Import Egg → Upload `egg/egg-hytale.yaml`

## Testing Checklist

- [ ] Profile picture click opens viewer dialog
- [ ] Can upload new avatar (if 24h has passed since last upload)
- [ ] Rate limit message appears if uploading again within 24h
- [ ] Light mode background appears white (not grey)
- [ ] Pelican Panel installer loads successfully
- [ ] Custom egg can be imported after installation

## Notes

- Avatar uploads are now rate-limited to 1 per day per user
- Pelican database is automatically initialized on first run
- All changes are committed to git and Docker image is pushed to Docker Hub
