import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * POST /api/mods/upload
 * Upload a mod .jar file directly to the server
 * Requires: ADMIN role or higher
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.jar')) {
      return NextResponse.json({ error: 'Only .jar files are allowed' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 });
    }

    // Sanitize filename — only allow alphanumeric, hyphens, underscores, dots
    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Check if a mod with this filename already exists
    const existing = await prisma.installedMod.findUnique({
      where: { fileName: sanitized },
    });
    if (existing) {
      return NextResponse.json({ error: 'A mod with this filename is already installed' }, { status: 400 });
    }

    const wingsUrl = process.env.WINGS_API_URL;
    const wingsKey = process.env.WINGS_API_KEY;
    const serverUuid = process.env.WINGS_SERVER_UUID;

    if (!wingsUrl || !wingsKey || !serverUuid) {
      return NextResponse.json({ error: 'Wings API configuration missing' }, { status: 500 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to server via Wings API
    const uploadPath = `/mods/${sanitized}`;
    const uploadUrl = `${wingsUrl}/api/servers/${serverUuid}/files/write?file=${encodeURIComponent(uploadPath)}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${wingsKey}`,
        'Content-Type': 'application/octet-stream',
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Wings API upload failed: ${uploadResponse.status}`);
    }

    // Save to database
    const installedMod = await prisma.installedMod.create({
      data: {
        curseforgeId: null, // No CurseForge ID for manual uploads
        name: sanitized.replace('.jar', ''),
        slug: sanitized.replace('.jar', '').toLowerCase(),
        version: 'manual',
        fileName: sanitized,
        installedBy: session.user.id,
        isCore: false,
      },
      include: {
        installer: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      mod: installedMod,
    });
  } catch (error) {
    console.error('Failed to upload mod:', error);
    return NextResponse.json({ error: 'Failed to upload mod' }, { status: 500 });
  }
}
