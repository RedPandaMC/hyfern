import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateTOTPSecret, generateTOTPQRCode } from '@/lib/auth-utils';

/**
 * POST /api/profile/2fa/setup
 * Generate a new TOTP secret and QR code for 2FA setup
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.totpEnabled) {
      return NextResponse.json({ error: '2FA is already enabled' }, { status: 400 });
    }

    const secret = generateTOTPSecret();
    const qrCode = await generateTOTPQRCode(secret, user.username);

    // Store the secret temporarily (not yet enabled)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { totpSecret: secret },
    });

    return NextResponse.json({ secret, qrCode });
  } catch (error) {
    console.error('Failed to setup 2FA:', error);
    return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 });
  }
}
