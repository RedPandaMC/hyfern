# HyFern Issues TODO

## Critical Issues

### 1. Avatar Upload Returns 500 Error
**Status**: 🔴 BLOCKING
**File**: `frontend/app/api/profile/avatar/route.ts`

**Problem**: 
- Avatar upload API returns 500 Internal Server Error
- The uploads directory mount exists but files aren't being written
- Frontend shows broken image link: `GET https://hyfern.us/uploads/avatars/... 500`

**Root Cause**:
- The `mkdir` command creates `/app/public/uploads/avatars` but the parent `/app/public/uploads` is a Docker volume mount
- The mount point exists but is empty (0 bytes) in container
- The Node.js process can't write files to the mount

**Fix Required**:
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
**Status**: 🔴 BLOCKING
**URL**: https://panel.hyfern.us

**Problem**:
- Pelican Panel returns "500 | Server Error"
- Panel was working after database initialization

**Investigation Needed**:
1. Check panel logs: `docker compose logs -f pelican-panel`
2. Check if database is accessible: `docker exec hyfern-pelican-panel ls -la /var/www/html/database/`
3. Verify database permissions (should be owned by www-data)
4. Check if Pelican completed setup wizard

**Possible Causes**:
- Database permissions changed
- Panel configuration corrupted
- Missing environment variables
- Wings trying to connect before panel is ready

**Fix Commands**:
```bash
# Check database file
docker exec hyfern-pelican-panel ls -la /var/www/html/database/

# Check database permissions (should be www-data:www-data)
docker exec hyfern-pelican-panel stat /var/www/html/database/database.sqlite

# Restart panel
docker compose restart pelican-panel

# Check logs
docker compose logs -f pelican-panel
```

---

### 3. Database File Organization
**Status**: 🟡 IMPROVEMENT
**Current**: `data/hyfern.db` (in root of data directory)
**Suggested**: `data/database/hyfern.db` or `data/prisma/hyfern.db`

**Problem**:
- Database file is in root of data directory
- Mixes database files with other data directories
- Not consistent with other services (pelican-database has its own directory)

**Fix Required**:
1. Update `docker-compose.yml` volume mount:
   ```yaml
   # From:
   - ./data/hyfern.db:/app/prisma/hyfern.db
   # To:
   - ./data/database:/app/prisma
   ```

2. Update `frontend/prisma.config.ts`:
   ```typescript
   datasource: {
     url: "file:/app/prisma/hyfern.db",
   }
   ```

3. Update init-permissions in docker-compose.yml:
   ```bash
   mkdir -p /data/database
   chown 1001:1001 /data/database
   ```

4. Move existing database:
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
```

## Deployment Checklist

- [ ] Fix avatar upload directory creation in API route
- [ ] Update Dockerfile to create uploads directory with correct permissions
- [ ] Fix Pelican Panel 500 error (investigate logs)
- [ ] Move hyfern.db to data/database/ directory
- [ ] Test avatar upload after fixes
- [ ] Verify Pelican Panel loads correctly
- [ ] Update README with any new setup steps

## Notes

- **Avatar Upload**: The editor works client-side, but the API route fails when saving
- **Pelican Panel**: May need to re-run setup wizard if database is corrupted
- **Database**: Consider backing up before moving to new location