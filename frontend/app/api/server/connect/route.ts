import { NextRequest, NextResponse } from 'next/server';
import { getQueryClient } from '@/lib/query';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // Verify password
    if (password !== process.env.SERVER_ACCESS_PASSWORD) {
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
