import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { getCurseForgeClient, isCurseForgeConfigured } from '@/lib/curseforge';
import { logger } from '@/lib/logger';

// Lazy load Redis only when needed
let redis: import('ioredis').Redis | null = null;

async function getRedis(): Promise<import('ioredis').Redis | null> {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    const { default: Redis } = await import('ioredis');
    redis = new Redis(process.env.REDIS_URL);
  }
  return redis;
}

const CACHE_TTL = 60 * 30; // 30 minutes

/**
 * GET /api/mods/[modId]/files
 * Get all files/versions for a specific mod
 * Requires: ADMIN role or higher
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions (ADMIN+)
    if (!hasPermission(session.user.role, 'ADMIN')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      );
    }

    if (!isCurseForgeConfigured()) {
      return NextResponse.json({ error: 'CurseForge API is not configured' }, { status: 501 });
    }

    const { modId } = await params;
    const modIdNum = parseInt(modId);

    if (isNaN(modIdNum)) {
      return NextResponse.json({ error: 'Invalid mod ID' }, { status: 400 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '50') || 50));
    const index = Math.max(0, parseInt(searchParams.get('index') || '0') || 0);

    // Generate cache key
    const cacheKey = `curseforge:mod:${modId}:files:${pageSize}:${index}`;

    // Try to get from cache
    const redisClient = await getRedis();
    if (redisClient) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached));
      }
    }

    // Get files from CurseForge
    const client = getCurseForgeClient();
    const result = await client.getModFiles(modIdNum, { pageSize, index });

    // Cache the result
    if (redisClient) {
      await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Failed to fetch mod files', { context: 'mods/[modId]/files', error: error as Error });
    return NextResponse.json(
      { error: 'Failed to fetch mod files' },
      { status: 500 }
    );
  }
}
