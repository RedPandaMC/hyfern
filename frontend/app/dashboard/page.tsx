'use client';

import { useServerStatus } from '@/hooks/use-server-status';
import { PlayerList } from '@/components/dashboard/player-list';
import { TPSGauge } from '@/components/dashboard/tps-gauge';
import { ResourceCharts } from '@/components/dashboard/resource-charts';
import { ServerControls } from '@/components/dashboard/server-controls';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, AlertCircle, Loader2 } from '@/lib/icons';

export default function DashboardPage() {
  const { data, error, isLoading, mutate } = useServerStatus(5000);

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading server status...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Failed to Load Server Status</h2>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <button
              onClick={() => mutate()}
              className="text-primary hover:underline"
            >
              Try Again
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Data is loading or not available
  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No server data available</p>
        </div>
      </div>
    );
  }

  const isOnline = data.online && data.status === 'online';

  return (
    <div className="space-y-6">
      {/* Server Status Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Server className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">HyFern Server</h1>
              <p className="text-sm text-muted-foreground">
                {data.version || 'Unknown Version'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isOnline ? 'default' : 'secondary'} className="text-sm">
              {isOnline ? (
                <>
                  <span className="mr-2 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Online
                </>
              ) : (
                <>
                  <span className="mr-2 h-2 w-2 rounded-full bg-gray-500" />
                  Offline
                </>
              )}
            </Badge>
          </div>
        </div>

        {data.motd && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm">{data.motd}</p>
          </div>
        )}
      </Card>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* TPS Gauge */}
        <div className="lg:col-span-1">
          {isOnline ? (
            <TPSGauge
              tps={data.performance.tps}
              mspt={data.performance.mspt}
            />
          ) : (
            <Card className="p-6">
              <div className="flex items-center justify-center h-full min-h-[300px]">
                <div className="text-center text-muted-foreground">
                  <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Server is offline</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Player List */}
        <div className="lg:col-span-2">
          <PlayerList
            players={data.players.list}
            maxPlayers={data.players.max}
            isOnline={isOnline}
          />
        </div>
      </div>

      {/* Resource Charts */}
      {isOnline && (
        <ResourceCharts
          memory={data.resources.memory}
          cpu={data.resources.cpu}
        />
      )}

      {/* Server Controls */}
      <ServerControls
        isOnline={isOnline}
        onActionComplete={() => mutate()}
      />

      {/* Additional Metrics */}
      {isOnline && (data as any).metrics && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Additional Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(data as any).metrics.chunks !== null && (
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">
                  {(data as any).metrics.chunks.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Chunks Loaded</div>
              </div>
            )}
            {(data as any).metrics.entities !== null && (
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">
                  {(data as any).metrics.entities.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Entities</div>
              </div>
            )}
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">
                {data.players.online}
              </div>
              <div className="text-sm text-muted-foreground">Players</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">
                {data.performance.tps.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">TPS</div>
            </div>
          </div>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date(data.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
