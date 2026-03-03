import { NextRequest, NextResponse } from 'next/server';
import { getQueryClient } from '@/lib/query';

export async function GET(request: NextRequest) {
  try {
    const queryClient = getQueryClient();
    const serverData = await queryClient.getServerStatusSafe();

    if ('error' in serverData) {
      return NextResponse.json({
        online: false,
        status: 'offline',
        players: { online: 0, max: 0, list: [] },
        performance: { tps: 0, mspt: 0 },
        resources: { memory: { used: 0, max: 0, free: 0 }, cpu: { usage: 0, cores: 0 } },
        version: null,
        motd: null,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json(serverData);
  } catch (error) {
    console.error('Failed to fetch public server status:', error);
    return NextResponse.json({
      online: false,
      status: 'offline',
      players: { online: 0, max: 0, list: [] },
      performance: { tps: 0, mspt: 0 },
      resources: { memory: { used: 0, max: 0, free: 0 }, cpu: { usage: 0, cores: 0 } },
      version: null,
      motd: null,
      timestamp: Date.now(),
    });
  }
}
