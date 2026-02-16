import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyTOTP, generateRecoveryCodes, hashRecoveryCode } from '@/lib/auth-utils';

/**
 * POST /api/profile/2fa/verify
 * Verify a TOTP token to complete 2FA setup
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'TOTP token is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.totpSecret) {
      return NextResponse.json({ error: 'Please setup 2FA first' }, { status: 400 });
    }

    if (user.totpEnabled) {
      return NextResponse.json({ error: '2FA is already enabled' }, { status: 400 });
    }

    const isValid = verifyTOTP(user.totpSecret, token);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token. Please try again.' }, { status: 400 });
    }

    // Generate recovery codes
    const recoveryCodes = generateRecoveryCodes();
    const hashedCodes = await Promise.all(recoveryCodes.map(hashRecoveryCode));

    // Enable 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totpEnabled: true,
        recoveryCodes: JSON.stringify(hashedCodes),
      },
    });

    return NextResponse.json({ success: true, recoveryCodes });
  } catch (error) {
    console.error('Failed to verify 2FA:', error);
    return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 });
  }
}
