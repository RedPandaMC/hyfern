import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { getCurseForgeClient, isCurseForgeConfigured } from '@/lib/curseforge';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * POST /api/mods/install-stream
 * Install a mod from CurseForge with streaming progress updates
 * Requires: ADMIN role or higher
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check permissions (ADMIN+)
    if (!hasPermission(session.user.role, 'ADMIN')) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin role required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await request.json();
    const { modId, fileId } = body;

    if (!isCurseForgeConfigured()) {
      return new Response(
        JSON.stringify({ error: 'CurseForge API is not configured' }),
        { status: 501, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!modId || !fileId) {
      return new Response(
        JSON.stringify({ error: 'Mod ID and File ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a readable stream for progress updates
    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          sendProgress({ stage: 'checking', progress: 0, message: 'Checking if mod is already installed...' });

          // Check if already installed
          const existing = await prisma.installedMod.findUnique({
            where: { curseforgeId: modId },
          });

          if (existing) {
            sendProgress({ stage: 'error', error: 'Mod is already installed' });
            controller.close();
            return;
          }

          sendProgress({ stage: 'fetching', progress: 5, message: 'Fetching mod details from CurseForge...' });

          // Get mod and file details from CurseForge
          const client = getCurseForgeClient();
          const [modResponse, fileResponse] = await Promise.all([
            client.getMod(modId),
            client.getModFile(modId, fileId),
          ]);

          const mod = modResponse.data;
          const file = fileResponse.data;

          sendProgress({
            stage: 'preparing',
            progress: 10,
            message: 'Preparing download...',
            fileSize: file.fileLength,
            fileName: file.fileName,
          });

          // Get download URL
          let downloadUrl = file.downloadUrl;
          if (!downloadUrl) {
            downloadUrl = await client.getFileDownloadUrl(modId, fileId);
          }

          // Validate download URL to prevent SSRF
          try {
            const parsedUrl = new URL(downloadUrl);
            if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
              throw new Error('Invalid download URL');
            }
            const hostname = parsedUrl.hostname.toLowerCase();
            if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' ||
                hostname.startsWith('10.') || hostname.startsWith('192.168.') || hostname.startsWith('172.') ||
                hostname.endsWith('.internal') || hostname.endsWith('.local')) {
              throw new Error('Invalid download URL');
            }
          } catch (err) {
            sendProgress({ stage: 'error', error: 'Invalid download URL' });
            controller.close();
            return;
          }

          sendProgress({ stage: 'downloading', progress: 15, message: 'Downloading mod file...', downloaded: 0, fileSize: file.fileLength });

          // Download the mod file with progress tracking
          const downloadResponse = await fetch(downloadUrl);
          if (!downloadResponse.ok) {
            throw new Error(`Failed to download mod: ${downloadResponse.status}`);
          }

          const reader = downloadResponse.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          const chunks: Uint8Array[] = [];
          let downloaded = 0;
          const totalSize = file.fileLength;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            downloaded += value.length;

            // Send progress update (15% to 70% of total progress)
            const downloadProgress = 15 + (downloaded / totalSize) * 55;
            sendProgress({
              stage: 'downloading',
              progress: Math.round(downloadProgress),
              message: 'Downloading mod file...',
              downloaded,
              fileSize: totalSize,
            });
          }

          const fileData = Buffer.concat(chunks);

          sendProgress({ stage: 'validating', progress: 70, message: 'Validating file integrity...' });

          // Validate file size
          if (fileData.length !== file.fileLength) {
            throw new Error('Downloaded file size does not match expected size');
          }

          // Validate file hash (SHA-1)
          const sha1Hash = crypto.createHash('sha1').update(fileData).digest('hex');
          const expectedHash = file.hashes.find(h => h.algo === 1)?.value;

          if (expectedHash && sha1Hash !== expectedHash) {
            throw new Error('File hash validation failed');
          }

          sendProgress({ stage: 'uploading', progress: 75, message: 'Uploading to server...' });

          // Upload to server via Wings API
          const wingsUrl = process.env.WINGS_API_URL;
          const wingsKey = process.env.WINGS_API_KEY;
          const serverUuid = process.env.WINGS_SERVER_UUID;

          if (!wingsUrl || !wingsKey || !serverUuid) {
            throw new Error('Wings API configuration missing');
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

          sendProgress({ stage: 'dependencies', progress: 85, message: 'Checking dependencies...' });

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

          sendProgress({ stage: 'saving', progress: 90, message: 'Saving to database...' });

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

          sendProgress({
            stage: 'complete',
            progress: 100,
            message: 'Installation complete!',
            mod: installedMod,
            warnings: missingDeps.length > 0 ? {
              missingDependencies: missingDeps,
              message: 'This mod requires additional dependencies to function properly.',
            } : null,
          });

          controller.close();
        } catch (error) {
          console.error('Failed to install mod:', error);
          sendProgress({
            stage: 'error',
            error: error instanceof Error ? error.message : 'Failed to install mod',
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Failed to install mod:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to install mod' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
