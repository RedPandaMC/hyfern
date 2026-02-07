import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/permissions';
import { Role } from '@/app/generated/prisma';
import { getPrometheusClient } from '@/lib/prometheus';
import { JVMMetrics } from '@/types/jvm';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and require ADMIN role or higher
    const session = await auth();
    requireRole(session, Role.ADMIN);

    // Get Prometheus client
    const prometheusClient = getPrometheusClient();

    // If Prometheus is not available, return mock data for development
    if (!prometheusClient) {
      if (process.env.NODE_ENV === 'development') {
        const mockMetrics: JVMMetrics = {
          heapUsed: 4096,
          heapMax: 8192,
          heapUsedPercent: 50,
          gcPauseTimeMs: 25.5,
          gcCount: 42,
          tps: {
            current: 19.8,
            average: 19.6,
            min: 18.2,
            max: 20.0,
          },
          viewDistance: {
            configured: 12,
            effective: 10,
          },
          timestamp: Date.now(),
        };

        return NextResponse.json({ metrics: mockMetrics });
      }

      throw new Error('Prometheus client not configured');
    }

    // Add queryInstant method for the metrics API
    const queryInstant = async (query: string) => {
      const url = `${process.env.PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(query)}`;
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return null;
      const data = await response.json();
      return data.data?.result?.[0] || null;
    };

    // Fetch metrics from Prometheus
    const [
      heapUsed,
      heapMax,
      gcPauseTime,
      gcCount,
      tpsCurrent,
      tpsAverage,
      tpsMin,
      tpsMax,
      configuredViewDistance,
      effectiveViewDistance,
    ] = await Promise.all([
      queryInstant('hytale_jvm_memory_heap_used'),
      queryInstant('hytale_jvm_memory_heap_max'),
      queryInstant('rate(hytale_jvm_gc_pause_seconds_sum[1h]) / rate(hytale_jvm_gc_pause_seconds_count[1h]) * 1000'),
      queryInstant('increase(hytale_jvm_gc_pause_seconds_count[1h])'),
      queryInstant('hytale_server_tps'),
      queryInstant('avg_over_time(hytale_server_tps[5m])'),
      queryInstant('min_over_time(hytale_server_tps[5m])'),
      queryInstant('max_over_time(hytale_server_tps[5m])'),
      queryInstant('hytale_server_view_distance_current'),
      queryInstant('hytale_server_view_distance_max'),
    ]);

    // Parse metric values
    const heapUsedBytes = parseFloat(heapUsed?.value?.[1] || '0');
    const heapMaxBytes = parseFloat(heapMax?.value?.[1] || '0');
    const heapUsedMB = heapUsedBytes / (1024 * 1024);
    const heapMaxMB = heapMaxBytes / (1024 * 1024);
    const heapUsedPercent = heapMaxMB > 0 ? (heapUsedMB / heapMaxMB) * 100 : 0;

    const metrics: JVMMetrics = {
      heapUsed: heapUsedMB,
      heapMax: heapMaxMB,
      heapUsedPercent,
      gcPauseTimeMs: parseFloat(gcPauseTime?.value?.[1] || '0'),
      gcCount: Math.round(parseFloat(gcCount?.value?.[1] || '0')),
      tps: {
        current: parseFloat(tpsCurrent?.value?.[1] || '20'),
        average: parseFloat(tpsAverage?.value?.[1] || '20'),
        min: parseFloat(tpsMin?.value?.[1] || '20'),
        max: parseFloat(tpsMax?.value?.[1] || '20'),
      },
      viewDistance: {
        configured: Math.round(parseFloat(configuredViewDistance?.value?.[1] || '10')),
        effective: Math.round(parseFloat(effectiveViewDistance?.value?.[1] || '10')),
      },
      timestamp: Date.now(),
    };

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Failed to get server metrics:', error);

    // Handle permission errors
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: error.message,
        },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: error.message,
        },
        { status: 401 }
      );
    }

    // Return mock data if Prometheus is unavailable (for development)
    if (process.env.NODE_ENV === 'development') {
      const mockMetrics: JVMMetrics = {
        heapUsed: 4096,
        heapMax: 8192,
        heapUsedPercent: 50,
        gcPauseTimeMs: 25.5,
        gcCount: 42,
        tps: {
          current: 19.8,
          average: 19.6,
          min: 18.2,
          max: 20.0,
        },
        viewDistance: {
          configured: 12,
          effective: 10,
        },
        timestamp: Date.now(),
      };

      return NextResponse.json({ metrics: mockMetrics });
    }

    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
