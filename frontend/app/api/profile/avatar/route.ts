import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { checkAvatarUploadRateLimit, recordAvatarUpload, formatTimeRemaining } from '@/lib/redis';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (increased for editor)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const OUTPUT_SIZE = 512; // Final avatar size

/**
 * POST /api/profile/avatar
 * Upload or update profile picture
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit (1 upload per day)
    const rateLimit = await checkAvatarUploadRateLimit(session.user.id);
    if (!rateLimit.canUpload) {
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. You can upload a new avatar in ${formatTimeRemaining(rateLimit.timeUntilReset || 0)}.` 
        },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB' },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Process image with sharp - resize to OUTPUT_SIZE and convert to JPEG
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Process image: resize to OUTPUT_SIZE, convert to JPEG, quality 90
    const processedImage = await sharp(buffer)
      .resize(OUTPUT_SIZE, OUTPUT_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: 90,
        progressive: true,
      })
      .toBuffer();

    // Build filename: userId-timestamp.jpg
    const fileName = `${session.user.id}-${Date.now()}.jpg`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Delete old avatar if exists
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarPath: true },
    });

    if (currentUser?.avatarPath) {
      const oldPath = path.join(process.cwd(), 'public', currentUser.avatarPath);
      if (existsSync(oldPath)) {
        await unlink(oldPath).catch(() => {});
      }
    }

    // Write processed file
    await writeFile(filePath, processedImage);

    // Update database
    const avatarUrl = `/uploads/avatars/${fileName}`;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarPath: avatarUrl },
    });

    // Record the upload for rate limiting
    await recordAvatarUpload(session.user.id);

    return NextResponse.json({ avatarPath: avatarUrl });
  } catch (error) {
    console.error('Failed to upload avatar:', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}

/**
 * DELETE /api/profile/avatar
 * Remove profile picture
 */
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarPath: true },
    });

    if (currentUser?.avatarPath) {
      const filePath = path.join(process.cwd(), 'public', currentUser.avatarPath);
      if (existsSync(filePath)) {
        await unlink(filePath).catch(() => {});
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarPath: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete avatar:', error);
    return NextResponse.json({ error: 'Failed to delete avatar' }, { status: 500 });
  }
}
