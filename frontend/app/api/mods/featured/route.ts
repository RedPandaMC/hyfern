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

const CACHE_TTL = 60 * 15; // 15 minutes

/**
 * GET /api/mods/featured
 * Get featured, popular, and recently updated mods from CurseForge
 * Requires: ADMIN role or higher
 */
export async function GET(request: NextRequest) {
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

    // Parse excluded mod IDs from query
    const { searchParams } = new URL(request.url);
    const excludedParam = searchParams.get('excluded');
    const excludedModIds = excludedParam 
      ? excludedParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
      : [];

    // Generate cache key
    const cacheKey = `curseforge:featured:${excludedModIds.sort().join(',')}`;

    // Try to get from cache
    const redisClient = await getRedis();
    if (redisClient) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached));
      }
    }

    // Fetch featured mods from CurseForge
    const client = getCurseForgeClient();
    const result = await client.getFeaturedMods(excludedModIds);

    // Cache the result
    if (redisClient) {
      await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('CurseForge featured mods error', { context: 'mods/featured', error: error as Error });
    return NextResponse.json(
      { error: 'Failed to fetch featured mods' },
      { status: 500 }
    );
  }
}
