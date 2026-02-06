import { NextRequest, NextResponse } from 'next/server';
import { getQueryClient } from '@/lib/query';
import { timingSafeEqual } from 'crypto';

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Compare against self to avoid short-circuit timing leak
    const buf = Buffer.from(a);
    timingSafeEqual(buf, buf);
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const accessPassword = process.env.SERVER_ACCESS_PASSWORD;
    if (!accessPassword || !password || !constantTimeCompare(String(password), accessPassword)) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Get server info from Query API
    const queryClient = getQueryClient();
    let serverData;

    try {
      serverData = await queryClient.getServerStatus();
    } catch (error) {
      // If Query API fails, still return basic connection info
      console.error('Failed to fetch server status:', error);
    }

    // Return server connection info
    return NextResponse.json({
      address: process.env.NEXT_PUBLIC_SERVER_ADDRESS || 'hyfern.us',
      port: 5520,
      password: process.env.SERVER_PASSWORD || 'password',
      version: serverData?.version || 'Unknown',
      maxPlayers: serverData?.players?.max || 100,
    });
  } catch (error) {
    console.error('Connect API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
