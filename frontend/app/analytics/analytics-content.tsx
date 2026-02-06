'use client';

import { BarChart, Zap, Users, TrendingUp, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export function AnalyticsContent() {
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
    </div>
  );
}
