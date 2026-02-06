import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { getCurseForgeClient, isCurseForgeConfigured } from '@/lib/curseforge';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * POST /api/mods/install
 * Install a mod from CurseForge
 * Requires: ADMIN role or higher
 */
export async function POST(request: NextRequest) {
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
    const { modId, fileId } = body;

    if (!isCurseForgeConfigured()) {
      return NextResponse.json({ error: 'CurseForge API is not configured' }, { status: 501 });
    }

    if (!modId || !fileId) {
      return NextResponse.json(
        { error: 'Mod ID and File ID are required' },
        { status: 400 }
      );
    }

    // Check if already installed
    const existing = await prisma.installedMod.findUnique({
      where: { curseforgeId: modId },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Mod is already installed' },
        { status: 400 }
      );
    }

    // Get mod and file details from CurseForge
    const client = getCurseForgeClient();
    const [modResponse, fileResponse] = await Promise.all([
      client.getMod(modId),
      client.getModFile(modId, fileId),
    ]);

    const mod = modResponse.data;
    const file = fileResponse.data;

    // Get download URL
    let downloadUrl = file.downloadUrl;
    if (!downloadUrl) {
      downloadUrl = await client.getFileDownloadUrl(modId, fileId);
    }

    // Validate download URL to prevent SSRF
    try {
      const parsedUrl = new URL(downloadUrl);
      if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
        return NextResponse.json({ error: 'Invalid download URL' }, { status: 400 });
      }
      const hostname = parsedUrl.hostname.toLowerCase();
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' ||
          hostname.startsWith('10.') || hostname.startsWith('192.168.') || hostname.startsWith('172.') ||
          hostname.endsWith('.internal') || hostname.endsWith('.local')) {
        return NextResponse.json({ error: 'Invalid download URL' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid download URL' }, { status: 400 });
    }

    // Download the mod file
    const downloadResponse = await fetch(downloadUrl);
    if (!downloadResponse.ok) {
      throw new Error(`Failed to download mod: ${downloadResponse.status}`);
    }

    const fileBuffer = await downloadResponse.arrayBuffer();
    const fileData = Buffer.from(fileBuffer);

    // Validate file size
    if (fileData.length !== file.fileLength) {
      throw new Error('Downloaded file size does not match expected size');
    }

    // Validate file hash (SHA-1)
    const sha1Hash = crypto.createHash('sha1').update(fileData).digest('hex');
    const expectedHash = file.hashes.find(h => h.algo === 1)?.value; // algo 1 = SHA-1

    if (expectedHash && sha1Hash !== expectedHash) {
      throw new Error('File hash validation failed');
    }

    // Upload to server via Wings API
    const wingsUrl = process.env.WINGS_API_URL;
    const wingsKey = process.env.WINGS_API_KEY;
    const serverUuid = process.env.WINGS_SERVER_UUID;

    if (!wingsUrl || !wingsKey || !serverUuid) {
      return NextResponse.json(
        { error: 'Wings API configuration missing' },
        { status: 500 }
      );
    }

    const uploadPath = `/mods/${file.fileName}`;
    const uploadUrl = `${wingsUrl}/api/servers/${serverUuid}/files/write?file=${encodeURIComponent(uploadPath)}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${wingsKey}`,
        'Content-Type': 'application/octet-stream',
      },
      body: fileData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Wings API upload failed: ${uploadResponse.status}`);
    }

    // Check for dependencies
    const requiredDeps = file.dependencies.filter(dep => dep.relationType === 3);
    const missingDeps: string[] = [];

    for (const dep of requiredDeps) {
      const installed = await prisma.installedMod.findUnique({
        where: { curseforgeId: dep.modId },
      });

      if (!installed) {
        try {
          const depMod = await client.getMod(dep.modId);
          missingDeps.push(depMod.data.name);
        } catch {
          missingDeps.push(`Mod ID: ${dep.modId}`);
        }
      }
    }

    // Save to database
    const installedMod = await prisma.installedMod.create({
      data: {
        curseforgeId: mod.id,
        name: mod.name,
        slug: mod.slug,
        version: file.displayName,
        fileName: file.fileName,
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
      warnings: missingDeps.length > 0 ? {
        missingDependencies: missingDeps,
        message: 'This mod requires additional dependencies to function properly.',
      } : null,
    });
  } catch (error) {
    console.error('Failed to install mod:', error);
    return NextResponse.json(
      { error: 'Failed to install mod' },
      { status: 500 }
    );
  }
}
