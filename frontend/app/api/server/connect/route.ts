import { NextRequest, NextResponse } from 'next/server';
import { getQueryClient } from '@/lib/query';
import { timingSafeEqual } from 'crypto';
import { auth } from '@/lib/auth';

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    const buf = Buffer.from(a);
    timingSafeEqual(buf, buf);
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const { password } = await request.json();

    const accessPassword = process.env.SERVER_ACCESS_PASSWORD;

    const isAuthenticated = !!session;
    const hasValidPassword = password && accessPassword && constantTimeCompare(String(password), accessPassword);

    if (!isAuthenticated && !hasValidPassword) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const address = process.env.NEXT_PUBLIC_SERVER_ADDRESS || 'hyfern.us';
    const port = parseInt(process.env.HYTALE_SERVER_PORT || '5520', 10);

    let serverData;
    let serverStatus = 'offline';
    try {
      const queryClient = getQueryClient();
      serverData = await queryClient.getServerStatusSafe();
      if (!('error' in serverData)) {
        serverStatus = serverData.status || 'offline';
      }
    } catch (error) {
      console.error('Failed to fetch server status:', error);
    }

    const response = NextResponse.json({
      address,
      port,
      version: serverData?.version || 'Unknown',
      maxPlayers: serverData?.players?.max || 100,
      players: serverData?.players?.online || 0,
      status: serverStatus,
      motd: serverData?.motd || null,
    });

    if (hasValidPassword && password) {
      response.cookies.set('server_access', password, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Connect API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}