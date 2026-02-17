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

const CACHE_TTL = 60 * 60; // 1 hour

/**
 * GET /api/mods/[modId]
 * Get detailed information about a specific mod
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

    const { modId: modIdParam } = await params;
    const modId = parseInt(modIdParam);
    if (isNaN(modId)) {
      return NextResponse.json(
        { error: 'Invalid mod ID' },
        { status: 400 }
      );
    }

    // Generate cache key
    const cacheKey = `curseforge:mod:${modId}`;

    // Try to get from cache
    const redisClient = await getRedis();
    if (redisClient) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached));
      }
    }

    // Get mod details from CurseForge
    const client = getCurseForgeClient();
    const [modResponse, descriptionResponse] = await Promise.all([
      client.getMod(modId),
      client.getModDescription(modId),
    ]);

    const result = {
      mod: modResponse.data,
      description: descriptionResponse.data,
    };

    // Cache the result
    if (redisClient) {
      await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Failed to fetch mod details', { context: 'mods/[modId]', error: error as Error });
    return NextResponse.json(
      { error: 'Failed to fetch mod details' },
      { status: 500 }
    );
  }
}
