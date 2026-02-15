import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

/**
 * GET /api/mods/config
 * Returns mod system configuration (whether CurseForge is available)
 * Requires: ADMIN role or higher
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions (ADMIN+)
    if (!hasPermission(session.user.role, 'ADMIN')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      curseforgeEnabled: !!process.env.CURSEFORGE_API_KEY,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedFileTypes: ['.jar'],
    });
  } catch (error) {
    console.error('Failed to fetch mod config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}
