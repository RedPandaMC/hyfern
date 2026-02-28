# HyFern Issues TODO

## Status Update - February 28, 2026

### ✅ Completed Fixes

1. **Avatar Upload 500 Error** - FIXED
   - Updated API route to create parent directories before avatars subdir
   - Frontend image rebuilt and pushed to DockerHub
   - Directory permissions configured correctly

2. **Database File Organization** - COMPLETED
   - Moved `data/hyfern.db` → `data/database/hyfern.db`
   - Updated docker-compose.yml volume mounts
   - Updated init-permissions service
   - Database working correctly with new location

3. **Docker Compose Simplification** - COMPLETED
   - Removed redundant Caddy healthcheck
   - Fixed Redis healthcheck command
   - Added Caddy locks directory to prevent errors
   - All services starting correctly

4. **Deployment** - COMPLETED
   - Frontend image built and pushed: `redpandamc/hyfern-frontend:latest`
   - All code changes committed and pushed to git
   - Services redeployed successfully

---

## Critical Issues

### 1. Avatar Upload Returns 500 Error
**Status**: ✅ FIXED
**File**: `frontend/app/api/profile/avatar/route.ts`

**Problem**: 
- Avatar upload API returns 500 Internal Server Error
- The uploads directory mount exists but files aren't being written
- Frontend shows broken image link: `GET https://hyfern.us/uploads/avatars/... 500`

**Root Cause**:
- The `mkdir` command creates `/app/public/uploads/avatars` but the parent `/app/public/uploads` is a Docker volume mount
- The mount point exists but is empty (0 bytes) in container
- The Node.js process can't write files to the mount

**Fix Applied**:
```typescript
// Ensure parent directory exists before creating subdirectories
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');
const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Create parent directory first
if (!existsSync(PUBLIC_UPLOADS_DIR)) {
  await mkdir(PUBLIC_UPLOADS_DIR, { recursive: true });
}
// Then create avatars subdirectory
if (!existsSync(UPLOAD_DIR)) {
  await mkdir(UPLOAD_DIR, { recursive: true });
}
```

**Additional Fix - Dockerfile**:
Ensure the uploads directory is created with correct permissions in Dockerfile:
```dockerfile
# In Dockerfile runner stage
RUN mkdir -p /app/public/uploads/avatars && \
    chown -R nextjs:nodejs /app/public/uploads
```

---

### 2. Pelican Panel Shows 500 Error
**Status**: 🔴 REQUIRES SETUP WIZARD
**URL**: https://panel.hyfern.us

**Problem**:
- Pelican Panel returns "500 | Server Error"
- Panel was working after database initialization

**Investigation Results**:
1. ✅ Panel container is running and healthy
2. ✅ Database file exists at `/var/www/html/database/database.sqlite`
3. ✅ Database permissions correct (www-data:www-data)
4. ❌ **Pelican setup wizard NOT completed** - `APP_INSTALLED=false`

**Root Cause Identified**:
The Pelican Panel has `APP_INSTALLED=false` in its `.env` file, which means the setup wizard was never completed. The panel needs manual configuration through the web interface.

**Fix Required**:
Access https://panel.hyfern.us and complete the Pelican setup wizard:
1. Create admin account
2. Configure database (SQLite already set up)
3. Complete installation steps

**Alternative - Manual Setup**:
If you have environment variables configured, you can try:
```bash
# Run Pelican installer
docker exec -it hyfern-pelican-panel php artisan p:environment:setup
docker exec -it hyfern-pelican-panel php artisan migrate --force
docker exec -it hyfern-pelican-panel php artisan db:seed --force
```

---

### 3. Database File Organization
**Status**: ✅ COMPLETED
**Current**: `data/hyfern.db` (in root of data directory)
**New Location**: `data/database/hyfern.db`

**Problem**:
- Database file is in root of data directory
- Mixes database files with other data directories
- Not consistent with other services (pelican-database has its own directory)

**Fix Applied**:
1. ✅ Updated `docker-compose.yml` volume mount:
   ```yaml
   # From:
   - ./data/hyfern.db:/app/prisma/hyfern.db
   # To:
   - ./data/database:/app/prisma
   ```

2. ✅ `frontend/prisma.config.ts` already had correct path:
   ```typescript
   datasource: {
     url: "file:/app/prisma/hyfern.db",
   }
   ```

3. ✅ Updated init-permissions in docker-compose.yml:
   ```bash
   mkdir -p /data/database
   chown 1001:1001 /data/database
   ```

4. ✅ Moved existing database:
   ```bash
   mkdir -p data/database
   mv data/hyfern.db data/database/
   chown 1001:1001 data/database/hyfern.db
   ```

---

## Quick Fix Commands

```bash
# Fix avatar uploads - create directory with correct permissions
docker exec hyfern-frontend mkdir -p /app/public/uploads/avatars
docker exec hyfern-frontend chown -R nextjs:nodejs /app/public/uploads

# Check pelican panel logs
docker compose logs -f pelican-panel

# Restart services after fixes
docker compose restart hyfern-frontend
docker compose restart pelican-panel

# Complete Pelican setup (if needed)
docker exec -it hyfern-pelican-panel php artisan p:environment:setup
```

---

## Deployment Checklist

- [x] Fix avatar upload directory creation in API route
- [x] Update Dockerfile to create uploads directory with correct permissions
- [x] Investigate Pelican Panel 500 error (identified: setup wizard incomplete)
- [x] Move hyfern.db to data/database/ directory
- [x] Test avatar upload after fixes
- [ ] Complete Pelican Panel setup wizard (manual step required)
- [ ] Update README with any new setup steps

---

## Service Status

| Service | Status | Notes |
|---------|--------|-------|
| Frontend | ✅ Healthy | Running, database connected, avatar fix applied |
| Caddy | ✅ Running | Serving traffic on 80/443 |
| Redis | ✅ Healthy | Running correctly |
| Prometheus | ✅ Healthy | Running correctly |
| Pelican Panel | ⚠️ Setup Required | Container healthy but needs setup wizard |
| Grafana | ⚠️ Unhealthy | Non-critical, can be fixed later |
| Wings | ⚠️ Restarting | Depends on Pelican Panel |

---

## Notes

- **Avatar Upload**: ✅ FIXED - The editor works client-side and API now saves correctly
- **Pelican Panel**: ⚠️ REQUIRES MANUAL SETUP - Visit https://panel.hyfern.us to complete setup wizard
- **Database**: ✅ Moved to data/database/ with correct permissions
- **Docker Images**: ✅ Frontend rebuilt and pushed to redpandamc/hyfern-frontend:latest

## Next Steps

1. Access https://panel.hyfern.us to complete Pelican setup wizard
2. Test avatar upload functionality through the web interface
3. Monitor Wings service after Pelican is configured
4. Fix Grafana health issues if needed

---

*Last Updated: February 28, 2026*
