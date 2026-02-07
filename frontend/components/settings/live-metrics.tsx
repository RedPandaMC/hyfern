'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, Gauge, TrendingUp, Eye } from '@/lib/icons';
import { JVMMetrics } from '@/types/jvm';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface LiveMetricsProps {
  refreshInterval?: number; // in milliseconds
}

export function LiveMetrics({ refreshInterval = 5000 }: LiveMetricsProps) {
  const { data, error, isLoading } = useSWR<{ metrics: JVMMetrics }>(
    '/api/server/metrics',
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
    }
  );

  const metrics = data?.metrics;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Failed to load metrics. Server may be offline.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading metrics...</p>
        </CardContent>
      </Card>
    );
  }

  const getTPSColor = (tps: number) => {
    if (tps >= 19.5) return 'text-green-500';
    if (tps >= 15) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getTPSStatus = (tps: number) => {
    if (tps >= 19.5) return 'Excellent';
    if (tps >= 15) return 'Good';
    return 'Poor';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Heap Usage */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Heap Memory</CardTitle>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                {Math.round(metrics.heapUsedPercent)}%
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round(metrics.heapUsed)}MB / {Math.round(metrics.heapMax)}MB
              </span>
            </div>
            <Progress value={metrics.heapUsedPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* TPS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Server TPS</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-bold ${getTPSColor(metrics.tps.current)}`}>
                {metrics.tps.current.toFixed(1)}
              </span>
              <Badge variant={metrics.tps.current >= 19.5 ? 'default' : 'secondary'}>
                {getTPSStatus(metrics.tps.current)}
              </Badge>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Avg: {metrics.tps.average.toFixed(1)}</span>
              <span>Min: {metrics.tps.min.toFixed(1)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GC Metrics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">GC Performance</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                {metrics.gcPauseTimeMs.toFixed(1)}ms
              </span>
              <span className="text-xs text-muted-foreground">avg pause</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {metrics.gcCount} collections (last hour)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Distance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">View Distance</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                {metrics.viewDistance.effective}
              </span>
              <span className="text-xs text-muted-foreground">chunks</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Max: {metrics.viewDistance.configured} chunks
              {metrics.viewDistance.effective < metrics.viewDistance.configured && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Limited
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
