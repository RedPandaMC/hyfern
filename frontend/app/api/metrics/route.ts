import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPrometheusClient } from '@/lib/prometheus';

const RANGE_MAP: Record<string, { seconds: number; step: string }> = {
  '1h':  { seconds: 3600,    step: '15s' },
  '6h':  { seconds: 21600,   step: '60s' },
  '24h': { seconds: 86400,   step: '300s' },
  '7d':  { seconds: 604800,  step: '1800s' },
};

function formatRangeData(result: any[]): { time: string; value: number }[] {
  if (!result || result.length === 0) return [];
  const values = result[0]?.values || [];
  return values.map(([timestamp, value]: [number, string]) => ({
    time: new Date(timestamp * 1000).toISOString(),
    value: parseFloat(value),
  }));
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'tps';
    const range = searchParams.get('range') || '1h';

    const rangeConfig = RANGE_MAP[range] || RANGE_MAP['1h'];
    const client = getPrometheusClient();

    if (!client) {
      return NextResponse.json({ error: 'Prometheus not configured' }, { status: 503 });
    }

    let data: any;

    switch (type) {
      case 'tps':
        data = formatRangeData(await client.getTPSHistory(rangeConfig.seconds, rangeConfig.step));
        break;
      case 'memory': {
        const mem = await client.getMemoryHistory(rangeConfig.seconds, rangeConfig.step);
        const usedData = formatRangeData(mem.used);
        const maxData = formatRangeData(mem.max);
        data = usedData.map((point, i) => ({
          time: point.time,
          used: point.value / (1024 * 1024), // Convert to MB
          max: maxData[i]?.value ? maxData[i].value / (1024 * 1024) : null,
        }));
        break;
      }
      case 'players':
        data = formatRangeData(await client.getPlayerHistory(rangeConfig.seconds, rangeConfig.step));
        break;
      case 'gc':
        data = formatRangeData(await client.getGCHistory(rangeConfig.seconds, rangeConfig.step));
        break;
      case 'overview': {
        const metrics = await client.getMetrics();
        const players = await client.getPlayersOnline();
        const uptime = await client.getUptime();
        const cpu = await client.getCPUUsage();
        data = {
          ...metrics,
          players,
          uptime,
          cpu,
        };
        break;
      }
      default:
        return NextResponse.json({ error: 'Unknown metric type' }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Metrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
