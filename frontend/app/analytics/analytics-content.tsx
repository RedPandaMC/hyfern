'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { BarChart, Zap, Users, TrendingUp, Activity, Gauge, MemoryStick, Server } from '@/lib/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeRangeSelector } from '@/components/analytics/time-range-selector';
import { MetricStatCard } from '@/components/analytics/metric-stat-card';
import { TPSChart } from '@/components/analytics/tps-chart';
import { MemoryChart } from '@/components/analytics/memory-chart';
import { PlayerChart } from '@/components/analytics/player-chart';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function formatUptime(seconds: number | null): string {
  if (!seconds) return 'N/A';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function AnalyticsContent() {
  const [range, setRange] = useState('1h');
  const grafanaUrl = process.env.NEXT_PUBLIC_GRAFANA_URL || 'http://localhost:3001';

  // Corrected dashboard UIDs to match provisioned JSON files
  const dashboards = {
    overview: 'hytale-server-overview',
    performance: 'hytale-performance-deep-dive',
    players: 'hytale-player-analytics',
    alerts: 'hytale-server-alerts',
  };

  const { data: overviewData } = useSWR('/api/metrics?type=overview', fetcher, {
    refreshInterval: 15000,
  });
  const overview = overviewData?.data;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance">
              <Zap className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="players">
              <Users className="w-4 h-4 mr-2" />
              Players
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <TrendingUp className="w-4 h-4 mr-2" />
              Alerts
            </TabsTrigger>
          </TabsList>
          <TimeRangeSelector value={range} onChange={setRange} />
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricStatCard
              title="Server TPS"
              value={overview?.tps != null ? overview.tps.toFixed(1) : 'N/A'}
              subtitle="Ticks per second"
              icon={Gauge}
              color={overview?.tps >= 18 ? 'text-green-500' : overview?.tps >= 15 ? 'text-yellow-500' : 'text-red-500'}
            />
            <MetricStatCard
              title="Players Online"
              value={overview?.players ?? 'N/A'}
              icon={Users}
              color="text-blue-500"
            />
            <MetricStatCard
              title="Active Chunks"
              value={overview?.chunks ?? 'N/A'}
              icon={Server}
              color="text-purple-500"
            />
            <MetricStatCard
              title="Uptime"
              value={formatUptime(overview?.uptime)}
              icon={Activity}
              color="text-primary"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TPSChart range={range} />
            <PlayerChart range={range} />
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricStatCard
              title="Current TPS"
              value={overview?.tps != null ? overview.tps.toFixed(1) : 'N/A'}
              icon={Gauge}
              color={overview?.tps >= 18 ? 'text-green-500' : 'text-yellow-500'}
            />
            <MetricStatCard
              title="MSPT"
              value={overview?.mspt != null ? `${overview.mspt.toFixed(1)}ms` : 'N/A'}
              subtitle="Milliseconds per tick"
              icon={Zap}
              color={overview?.mspt <= 50 ? 'text-green-500' : 'text-red-500'}
            />
            <MetricStatCard
              title="Heap Used"
              value={overview?.heapUsed != null ? `${Math.round(overview.heapUsed / (1024 * 1024))} MB` : 'N/A'}
              subtitle={overview?.heapMax ? `/ ${Math.round(overview.heapMax / (1024 * 1024))} MB` : ''}
              icon={MemoryStick}
              color="text-blue-500"
            />
            <MetricStatCard
              title="CPU Usage"
              value={overview?.cpu != null ? `${overview.cpu.toFixed(1)}%` : 'N/A'}
              icon={Activity}
              color={overview?.cpu <= 70 ? 'text-green-500' : 'text-red-500'}
            />
          </div>

          <TPSChart range={range} />
          <MemoryChart range={range} />

          {/* Grafana GC panel as iframe (complex visualization) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">GC Pause Times (Grafana)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                src={`${grafanaUrl}/d-solo/${dashboards.performance}?orgId=1&theme=dark&panelId=4`}
                width="100%"
                height="350"
                frameBorder="0"
                className="rounded-b-lg"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Players Tab */}
        <TabsContent value="players" className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <MetricStatCard
              title="Players Online"
              value={overview?.players ?? 'N/A'}
              icon={Users}
              color="text-green-500"
            />
            <MetricStatCard
              title="Active Entities"
              value={overview?.entities ?? 'N/A'}
              icon={Activity}
              color="text-purple-500"
            />
            <MetricStatCard
              title="Active Chunks"
              value={overview?.chunks ?? 'N/A'}
              icon={Server}
              color="text-blue-500"
            />
          </div>

          <PlayerChart range={range} />

          {/* Grafana peak hours heatmap (complex visualization) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Peak Hours Heatmap (Grafana)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                src={`${grafanaUrl}/d-solo/${dashboards.players}?orgId=1&theme=dark&panelId=2`}
                width="100%"
                height="350"
                frameBorder="0"
                className="rounded-b-lg"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alert Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                src={`${grafanaUrl}/d-solo/${dashboards.alerts}?orgId=1&theme=dark&panelId=4`}
                width="100%"
                height="400"
                frameBorder="0"
                className="rounded-b-lg"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">TPS Alerts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <iframe
                  src={`${grafanaUrl}/d-solo/${dashboards.alerts}?orgId=1&theme=dark&panelId=1`}
                  width="100%"
                  height="300"
                  frameBorder="0"
                  className="rounded-b-lg"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Memory Alerts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <iframe
                  src={`${grafanaUrl}/d-solo/${dashboards.alerts}?orgId=1&theme=dark&panelId=2`}
                  width="100%"
                  height="300"
                  frameBorder="0"
                  className="rounded-b-lg"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
