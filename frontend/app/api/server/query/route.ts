import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getQueryClient } from '@/lib/query';
import { getPrometheusClient } from '@/lib/prometheus';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch data from Query API
    const queryClient = getQueryClient();
    const queryData = await queryClient.getServerStatusSafe();

    // Check if query failed
    if ('error' in queryData) {
      return NextResponse.json(queryData, { status: 503 });
    }

    // Optionally enhance with Prometheus metrics if available
    const prometheusClient = getPrometheusClient();
    if (prometheusClient) {
      try {
        const metrics = await prometheusClient.getMetrics();

        // Merge Prometheus data with Query data
        const enhancedData = {
          ...queryData,
          performance: {
            ...queryData.performance,
            // Prefer Prometheus data if available
            tps: metrics.tps ?? queryData.performance.tps,
            mspt: metrics.mspt ?? queryData.performance.mspt,
          },
          resources: {
            ...queryData.resources,
            memory: {
              ...queryData.resources.memory,
              // Enhance with Prometheus heap data if available
              ...(metrics.heapUsed && metrics.heapMax ? {
                used: metrics.heapUsed,
                max: metrics.heapMax,
                free: metrics.heapMax - metrics.heapUsed,
              } : {}),
            },
          },
          metrics: {
            chunks: metrics.chunks,
            entities: metrics.entities,
          },
        };

        return NextResponse.json(enhancedData);
      } catch (prometheusError) {
        console.warn('Failed to fetch Prometheus metrics, using Query data only:', prometheusError);
        // Fall back to Query data only
        return NextResponse.json(queryData);
      }
    }

    return NextResponse.json(queryData);
  } catch (error) {
    console.error('Failed to fetch server status:', error);
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
