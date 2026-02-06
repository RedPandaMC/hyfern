'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { JVMConfigurator } from '@/components/settings/jvm-configurator';
import { LiveMetrics } from '@/components/settings/live-metrics';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle } from 'lucide-react';
import { JVMConfig, JVMPreset } from '@/types/jvm';

interface JVMResponse {
  currentFlags: string;
  pendingFlags?: string;
  config: Partial<JVMConfig>;
  restartRequired?: boolean;
}

export function JVMSettingsContent() {
  const router = useRouter();
  const [jvmData, setJvmData] = useState<JVMResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restartRequired, setRestartRequired] = useState(false);

  useEffect(() => {
    fetchJVMConfig();
  }, []);

  const fetchJVMConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jvm');

      if (!response.ok) {
        throw new Error(`Failed to fetch JVM config: ${response.status}`);
      }

      const data = await response.json();
      setJvmData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (config: JVMConfig) => {
    const response = await fetch('/api/jvm', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to save JVM configuration');
    }

    const data = await response.json();
    setJvmData(data);
    setRestartRequired(data.restartRequired || false);
  };

  const handleApplyPreset = async (preset: JVMPreset) => {
    const response = await fetch('/api/jvm', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preset }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to apply preset');
    }

    const data = await response.json();
    setJvmData(data);
    setRestartRequired(data.restartRequired || false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading JVM configuration...</div>
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
              <h3 className="font-semibold text-lg">Failed to load JVM configuration</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!jvmData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Restart Required Banner */}
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
              Your JVM configuration changes have been saved but require a server restart to take effect.
              Go to the dashboard to restart your server.
            </p>
          </div>
        </div>
      )}

      {/* Live Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Live Performance Metrics</h3>
        <LiveMetrics refreshInterval={5000} />
      </div>

      <Separator />

      {/* JVM Configuration */}
      <div>
        <h3 className="text-lg font-semibold mb-4">JVM Configuration</h3>
        <JVMConfigurator
          initialConfig={jvmData.config}
          currentFlags={jvmData.currentFlags}
          onSave={handleSave}
          onApplyPreset={handleApplyPreset}
        />
      </div>
    </div>
  );
}
