import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { getCurseForgeClient } from '@/lib/curseforge';
import Redis from 'ioredis';

// Initialize Redis client for caching
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null;

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
    if (redis) {
      const cached = await redis.get(cacheKey);
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
    if (redis) {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch mod details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mod details' },
      { status: 500 }
    );
  }
}
