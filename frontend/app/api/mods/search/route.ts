import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { getCurseForgeClient } from '@/lib/curseforge';
import Redis from 'ioredis';

// Initialize Redis client for caching
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null;

const CACHE_TTL = 60 * 15; // 15 minutes

/**
 * GET /api/mods/search
 * Search for mods on CurseForge with Redis caching
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const validSortFields = ['Popularity', 'LastUpdated', 'Name', 'TotalDownloads'];
    const sortBy = validSortFields.includes(searchParams.get('sortBy') || '')
      ? searchParams.get('sortBy')!
      : 'Popularity';
    const page = Math.max(0, parseInt(searchParams.get('page') || '0') || 0);
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20') || 20));
    const categoryId = category ? parseInt(category) : undefined;
    if (categoryId !== undefined && (isNaN(categoryId) || categoryId < 0)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    // Generate cache key
    const cacheKey = `curseforge:search:${query}:${categoryId}:${sortBy}:${page}:${pageSize}`;

    // Try to get from cache
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached));
      }
    }

    // Search CurseForge
    const client = getCurseForgeClient();
    const result = await client.searchMods({
      searchFilter: query,
      categoryId,
      sortField: sortBy as any,
      sortOrder: 'desc',
      index: page,
      pageSize: pageSize,
    });

    // Cache the result
    if (redis) {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('CurseForge search error:', error);
    return NextResponse.json(
      { error: 'Failed to search mods' },
      { status: 500 }
    );
  }
}
