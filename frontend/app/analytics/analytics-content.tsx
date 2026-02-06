'use client';

import { useState } from 'react';
import { BarChart, TrendingUp, Users, Zap, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export function AnalyticsContent() {
  const [embedMode, setEmbedMode] = useState<'grafana' | 'native'>('grafana');

  const grafanaUrl = process.env.NEXT_PUBLIC_GRAFANA_URL || 'http://localhost:3001';

  // Grafana dashboard UIDs (these should match your provisioned dashboards)
  const dashboards = {
    overview: 'server-overview',
    performance: 'performance-deep-dive',
    players: 'player-analytics',
    alerts: 'alerts',
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <Card className="p-4 bg-[#0C1222] border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Display Mode</h3>
            <p className="text-sm text-gray-400">
              Choose how to view analytics data
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={embedMode === 'grafana' ? 'default' : 'outline'}
              onClick={() => setEmbedMode('grafana')}
              className={
                embedMode === 'grafana'
                  ? 'bg-[#00D4AA] text-[#0C1222]'
                  : 'border-gray-700'
              }
            >
              Grafana Embeds
            </Button>
            <Button
              variant={embedMode === 'native' ? 'default' : 'outline'}
              onClick={() => setEmbedMode('native')}
              className={
                embedMode === 'native'
                  ? 'bg-[#00D4AA] text-[#0C1222]'
                  : 'border-gray-700'
              }
            >
              Native Charts
            </Button>
          </div>
        </div>
      </Card>

      {/* Grafana Embeds Mode */}
      {embedMode === 'grafana' && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-[#1a1f35] border border-gray-800">
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

          <TabsContent value="overview" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Server Overview</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    `${grafanaUrl}/d/${dashboards.overview}`,
                    '_blank'
                  )
                }
                className="border-gray-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Grafana
              </Button>
            </div>
            <Card className="overflow-hidden bg-[#0C1222] border-gray-800">
              <iframe
                src={`${grafanaUrl}/d-solo/${dashboards.overview}?orgId=1&theme=dark&panelId=1`}
                width="100%"
                height="600"
                frameBorder="0"
                className="w-full"
              />
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Performance Deep Dive
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    `${grafanaUrl}/d/${dashboards.performance}`,
                    '_blank'
                  )
                }
                className="border-gray-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Grafana
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {/* TPS Timeline */}
              <Card className="overflow-hidden bg-[#0C1222] border-gray-800">
                <div className="p-4 border-b border-gray-800">
                  <h4 className="font-semibold text-white">TPS Timeline</h4>
                </div>
                <iframe
                  src={`${grafanaUrl}/d-solo/${dashboards.performance}?orgId=1&theme=dark&panelId=2`}
                  width="100%"
                  height="400"
                  frameBorder="0"
                />
              </Card>

              {/* Heap Memory */}
              <Card className="overflow-hidden bg-[#0C1222] border-gray-800">
                <div className="p-4 border-b border-gray-800">
                  <h4 className="font-semibold text-white">Heap Memory Usage</h4>
                </div>
                <iframe
                  src={`${grafanaUrl}/d-solo/${dashboards.performance}?orgId=1&theme=dark&panelId=3`}
                  width="100%"
                  height="400"
                  frameBorder="0"
                />
              </Card>

              {/* GC Performance */}
              <Card className="overflow-hidden bg-[#0C1222] border-gray-800">
                <div className="p-4 border-b border-gray-800">
                  <h4 className="font-semibold text-white">GC Performance</h4>
                </div>
                <iframe
                  src={`${grafanaUrl}/d-solo/${dashboards.performance}?orgId=1&theme=dark&panelId=4`}
                  width="100%"
                  height="400"
                  frameBorder="0"
                />
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="players" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Player Analytics</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    `${grafanaUrl}/d/${dashboards.players}`,
                    '_blank'
                  )
                }
                className="border-gray-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Grafana
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {/* Online Players */}
              <Card className="overflow-hidden bg-[#0C1222] border-gray-800">
                <div className="p-4 border-b border-gray-800">
                  <h4 className="font-semibold text-white">Players Online</h4>
                </div>
                <iframe
                  src={`${grafanaUrl}/d-solo/${dashboards.players}?orgId=1&theme=dark&panelId=1`}
                  width="100%"
                  height="400"
                  frameBorder="0"
                />
              </Card>

              {/* Peak Hours Heatmap */}
              <Card className="overflow-hidden bg-[#0C1222] border-gray-800">
                <div className="p-4 border-b border-gray-800">
                  <h4 className="font-semibold text-white">Peak Hours Heatmap</h4>
                </div>
                <iframe
                  src={`${grafanaUrl}/d-solo/${dashboards.players}?orgId=1&theme=dark&panelId=2`}
                  width="100%"
                  height="400"
                  frameBorder="0"
                />
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Alerts & Monitoring</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(`${grafanaUrl}/d/${dashboards.alerts}`, '_blank')
                }
                className="border-gray-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Grafana
              </Button>
            </div>
            <Card className="overflow-hidden bg-[#0C1222] border-gray-800">
              <iframe
                src={`${grafanaUrl}/d-solo/${dashboards.alerts}?orgId=1&theme=dark&panelId=1`}
                width="100%"
                height="600"
                frameBorder="0"
                className="w-full"
              />
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Native Charts Mode (Placeholder) */}
      {embedMode === 'native' && (
        <Card className="p-12 bg-[#0C1222] border-gray-800">
          <div className="text-center space-y-4">
            <BarChart className="w-16 h-16 text-[#00D4AA] mx-auto" />
            <h3 className="text-xl font-semibold text-white">
              Native Charts Coming Soon
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              We're working on native Recharts visualizations. For now, please use
              the Grafana embeds for comprehensive analytics.
            </p>
            <Button
              onClick={() => setEmbedMode('grafana')}
              className="bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#0C1222]"
            >
              Switch to Grafana
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
