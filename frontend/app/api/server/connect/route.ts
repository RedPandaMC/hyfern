import { NextRequest, NextResponse } from 'next/server';
import { getQueryClient } from '@/lib/query';
import { getPelicanClient } from '@/lib/pelican';
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

    // Try to get server address and port from Pelican Panel
    let address = process.env.NEXT_PUBLIC_SERVER_ADDRESS || 'hyfern.us';
    let port = 5520;

    try {
      const pelicanClient = getPelicanClient();
      const serverDetails = await pelicanClient.getServerDetails();
      const allocation = serverDetails?.attributes?.relationships?.allocations?.data?.[0]?.attributes;
      if (allocation) {
        // Use the allocation's alias (domain) if set, otherwise the IP
        address = allocation.alias || allocation.ip_alias || allocation.ip || address;
        port = allocation.port || port;
      }
    } catch (error) {
      // Pelican API unavailable — fall back to env vars
      console.error('Failed to fetch server allocation from Pelican:', error);
    }

    // Get server status from Query API
    let serverData;
    try {
      const queryClient = getQueryClient();
      serverData = await queryClient.getServerStatus();
    } catch (error) {
      console.error('Failed to fetch server status:', error);
    }

    return NextResponse.json({
      address,
      port,
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
