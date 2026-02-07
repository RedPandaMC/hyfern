'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, AlertCircle, Info } from '@/lib/icons';

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

interface ConfigEditorProps {
  initialConfig: ServerConfig;
  onSave: (config: ServerConfig) => Promise<void>;
}

export function ConfigEditor({ initialConfig, onSave }: ConfigEditorProps) {
  const [config, setConfig] = useState<ServerConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleFieldChange = (field: keyof ServerConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(config);
      setHasChanges(false);
      toast.success('Configuration saved successfully', {
        description: 'Server restart required to apply changes',
      });
    } catch (error) {
      toast.error('Failed to save configuration', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const effectiveViewDistance = config.PerformanceSaver?.ViewDistance || config.MaxViewRadius;

  return (
    <div className="space-y-6">
      {/* Server Identity */}
      <Card>
        <CardHeader>
          <CardTitle>Server Identity</CardTitle>
          <CardDescription>
            Configure your server's name and message of the day
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serverName">Server Name</Label>
            <Input
              id="serverName"
              value={config.ServerName}
              onChange={(e) => handleFieldChange('ServerName', e.target.value)}
              placeholder="My HyFern Server"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motd">Message of the Day (MOTD)</Label>
            <Textarea
              id="motd"
              value={config.MOTD}
              onChange={(e) => handleFieldChange('MOTD', e.target.value)}
              placeholder="Welcome to my server!"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Displayed to players when they join the server
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card>
        <CardHeader>
          <CardTitle>Access Control</CardTitle>
          <CardDescription>
            Set a password to restrict server access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Server Password</Label>
            <Input
              id="password"
              type="password"
              value={config.Password}
              onChange={(e) => handleFieldChange('Password', e.target.value)}
              placeholder="Leave empty for no password"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to allow anyone to join
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Player & Performance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Player & Performance Settings</CardTitle>
          <CardDescription>
            Configure player limits and view distance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="maxPlayers">Maximum Players</Label>
              <span className="text-sm font-medium">{config.MaxPlayers}</span>
            </div>
            <Slider
              id="maxPlayers"
              min={1}
              max={100}
              step={1}
              value={[config.MaxPlayers]}
              onValueChange={([value]) => handleFieldChange('MaxPlayers', value)}
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of concurrent players (1-100)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="maxViewRadius">Maximum View Radius</Label>
              <span className="text-sm font-medium">{config.MaxViewRadius} chunks</span>
            </div>
            <Slider
              id="maxViewRadius"
              min={6}
              max={64}
              step={1}
              value={[config.MaxViewRadius]}
              onValueChange={([value]) => handleFieldChange('MaxViewRadius', value)}
            />
            <p className="text-xs text-muted-foreground">
              Maximum view distance for players (6-64 chunks)
            </p>
          </div>

          {/* Performance Saver Info */}
          {effectiveViewDistance !== config.MaxViewRadius && (
            <div className="flex items-start gap-3 rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Performance Saver Active</p>
                <p className="text-xs text-muted-foreground">
                  Effective view distance: {effectiveViewDistance} chunks (limited by PerformanceSaver)
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {hasChanges && (
            <>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span>You have unsaved changes</span>
            </>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          size="lg"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
