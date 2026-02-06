import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/mods/installed
 * List all installed mods
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

    // Fetch installed mods from database
    const installedMods = await prisma.installedMod.findMany({
      include: {
        installer: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        installedAt: 'desc',
      },
    });

    return NextResponse.json({
      mods: installedMods,
      count: installedMods.length,
    });
  } catch (error) {
    console.error('Failed to fetch installed mods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch installed mods' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mods/installed
 * Uninstall a mod
 * Requires: ADMIN role or higher
 */
export async function DELETE(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { modId } = body;

    if (!modId) {
      return NextResponse.json(
        { error: 'Mod ID is required' },
        { status: 400 }
      );
    }

    // Check if mod exists
    const mod = await prisma.installedMod.findUnique({
      where: { id: modId },
    });

    if (!mod) {
      return NextResponse.json(
        { error: 'Mod not found' },
        { status: 404 }
      );
    }

    // Prevent uninstalling core mods
    if (mod.isCore) {
      return NextResponse.json(
        { error: 'Cannot uninstall core mods' },
        { status: 400 }
      );
    }

    // Delete the mod file via Wings API
    const wingsUrl = process.env.WINGS_API_URL;
    const wingsKey = process.env.WINGS_API_KEY;
    const serverUuid = process.env.WINGS_SERVER_UUID;

    if (!wingsUrl || !wingsKey || !serverUuid) {
      return NextResponse.json(
        { error: 'Wings API configuration missing' },
        { status: 500 }
      );
    }

    const filePath = `/mods/${mod.fileName}`;
    const deleteUrl = `${wingsUrl}/api/servers/${serverUuid}/files/delete`;

    const deleteResponse = await fetch(deleteUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${wingsKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        root: '/server',
        files: [filePath],
      }),
    });

    if (!deleteResponse.ok) {
      throw new Error(`Wings API error: ${deleteResponse.status}`);
    }

    // Remove from database
    await prisma.installedMod.delete({
      where: { id: modId },
    });

    return NextResponse.json({
      success: true,
      message: 'Mod uninstalled successfully',
    });
  } catch (error) {
    console.error('Failed to uninstall mod:', error);
    return NextResponse.json(
      { error: 'Failed to uninstall mod' },
      { status: 500 }
    );
  }
}
