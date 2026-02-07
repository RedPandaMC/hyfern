'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConfigEditor } from '@/components/settings/config-editor';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from '@/lib/icons';

interface ServerConfig {
  ServerName: string;
  MOTD: string;
  Password: string;
  MaxPlayers: number;
  MaxViewRadius: number;
  PerformanceSaver?: {
    ViewDistance: number;
  };
}

export function SettingsContent() {
  const router = useRouter();
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restartRequired, setRestartRequired] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/server/config');

      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`);
      }

      const data = await response.json();
      setConfig(data.config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newConfig: ServerConfig) => {
    const response = await fetch('/api/server/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config: newConfig }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to save configuration');
    }

    const data = await response.json();
    setConfig(data.config);
    setRestartRequired(data.restartRequired || false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading configuration...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div className="text-center">
              <h3 className="font-semibold text-lg">Failed to load configuration</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <>
      {restartRequired && (
        <div className="flex items-start gap-3 rounded-lg border border-orange-500/50 bg-orange-500/10 p-4">
          <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">Restart Required</p>
              <Badge variant="outline" className="border-orange-500 text-orange-500">
                Pending Changes
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Your configuration changes have been saved but require a server restart to take effect.
              Go to the dashboard to restart your server.
            </p>
          </div>
        </div>
      )}

      <ConfigEditor initialConfig={config} onSave={handleSave} />
    </>
  );
}
