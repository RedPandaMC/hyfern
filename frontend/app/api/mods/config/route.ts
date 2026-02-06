import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * GET /api/mods/config
 * Returns mod system configuration (whether CurseForge is available)
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    curseforgeEnabled: !!process.env.CURSEFORGE_API_KEY,
  });
}
