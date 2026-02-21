# HyFern Development Tasks

## Priority: HIGH

### Docker Infrastructure
- [x] Create TODO.md document
- [x] Fix Docker: Add HOME env, specific tags, rebuild better-sqlite3
- [x] Docker security: Add read-only fs, cap_drop, no_new_privileges
- [x] Create GitHub Actions workflow for DockerHub upload (redpandamc/hyfern-frontend:latest)

### Core Fixes
- [x] Fix Hytale references (layout.tsx, schema.prisma) - "Minecraft" → "Hytale"
- [x] Fix landing page: Logo AFTER "HyFern" text

## Priority: MEDIUM

### Background Optimizations
- [x] Lines totally black in light mode (increased opacity to 0.85)
- [x] Loop connections: 4-6 stars, bigger spacing (increased distances, modified loop generation)
- [x] More visible parallax lines (increased line width from 1.5 to 2.5)
- [x] Fix lines not traveling with theme change (added isDark to effect deps)
- [x] Change to 2-finger hold, only work on background

### UI Improvements
- [x] Add theme toggle animation (rotation + crossfade)
- [ ] Update favicon (not yet implemented)

## Priority: LOW

### Future Improvements
- [ ] Add loading skeletons for better UX
- [ ] Optimize background performance further

---

## Notes

- DockerHub: `redpandamc/hyfern-frontend:latest`
- Security: Read-only root filesystem with tmpfs for write-needed areas
- Build trigger: Push when done, git commit when appropriate

## Detailed Changes

### 2026-02-21
- Created TODO.md document
- Planned all Docker, Hytale, background, and UI fixes

### Docker Changes
1. **Dockerfile**:
   - Changed base image to specific tag: `node:22.22.0-slim`
   - Added `ENV HOME=/app` and `ENV NPM_CONFIG_CACHE=/app/.npm` to fix npm permission errors
   - Added `libc6-dev` to build native modules
   - Added `@prisma/adapter-better-sqlite3` to dependencies
   - Added tmp directories for Next.js cache

2. **docker-compose.yml**:
   - Added security options: `no-new-privileges: true`, `cap_drop: ALL`, `read_only: true` to hyfern-frontend
   - Added tmpfs for write-needed directories
   - Added security to redis and init-permissions services

3. **GitHub Actions** (new file: `.github/workflows/docker.yml`):
   - Builds and pushes to DockerHub on push to main
   - Multi-platform builds (amd64, arm64)
   - Tags with SHA and `latest`

### Code Changes
1. **Hytale References**:
   - Updated `layout.tsx`: "Minecraft Server Management" → "Hytale Server Management"
   - Updated `schema.prisma`: Comment changed to "Hytale mods"

2. **Landing Page**:
   - Moved Logo component to be after "HyFern" text (was below)

3. **Background**:
   - Increased line opacity in light mode (0.25 → 0.85)
   - Increased line width (1.5 → 2.5)
   - Increased spacing: MIN_DISTANCE 25→30, MAX_CONNECTION_DISTANCE 80→120, MIN_CONSTELLATION_DISTANCE 180→250
   - Modified loop generation to create loops with exactly 4-6 stars
   - Scattered stars now avoid being placed in the middle of constellations
   - Added isDark to canvas redraw effect dependencies
   - Changed touch hold to require 2 fingers instead of 1

4. **Theme Toggle**:
   - Added rotation animation on click
   - Added crossfade transition between sun/moon icons
   - Added scale animation for smoother transition