'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Save, AlertCircle, Zap, Code } from 'lucide-react';
import { JVMConfig, JVMPreset, JVM_PRESETS, jvmConfigToFlags, GCType } from '@/types/jvm';

interface JVMConfiguratorProps {
  initialConfig: Partial<JVMConfig>;
  currentFlags: string;
  onSave: (config: JVMConfig) => Promise<void>;
  onApplyPreset: (preset: JVMPreset) => Promise<void>;
}

export function JVMConfigurator({
  initialConfig,
  currentFlags,
  onSave,
  onApplyPreset,
}: JVMConfiguratorProps) {
  const [config, setConfig] = useState<JVMConfig>({
    minMemory: initialConfig.minMemory || 4,
    maxMemory: initialConfig.maxMemory || 8,
    gcType: initialConfig.gcType || 'G1GC',
    maxGCPauseMillis: initialConfig.maxGCPauseMillis || 150,
    parallelRefProc: initialConfig.parallelRefProc || false,
    useAOTCache: initialConfig.useAOTCache || false,
    enableBackups: initialConfig.enableBackups !== false,
    enableSentry: initialConfig.enableSentry || false,
    customFlags: initialConfig.customFlags || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'presets'>('basic');

  const handleFieldChange = <K extends keyof JVMConfig>(field: K, value: JVMConfig[K]) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(config);
      setHasChanges(false);
      toast.success('JVM configuration saved', {
        description: 'Server restart required to apply changes',
      });
    } catch (error) {
      toast.error('Failed to save JVM configuration', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyPreset = async (preset: JVMPreset) => {
    setIsSaving(true);
    try {
      await onApplyPreset(preset);
      setConfig(JVM_PRESETS[preset].config);
      setHasChanges(false);
      toast.success(`${JVM_PRESETS[preset].name} preset applied`, {
        description: 'Server restart required to apply changes',
      });
    } catch (error) {
      toast.error('Failed to apply preset', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const pendingFlags = jvmConfigToFlags(config);
  const flagsChanged = pendingFlags !== currentFlags;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
        </TabsList>

        {/* Basic Settings */}
        <TabsContent value="basic" className="space-y-6">
          {/* Memory Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Memory Configuration</CardTitle>
              <CardDescription>
                Configure JVM heap memory allocation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="minMemory">Minimum Heap (-Xms)</Label>
                  <span className="text-sm font-medium">{config.minMemory} GB</span>
                </div>
                <Slider
                  id="minMemory"
                  min={1}
                  max={32}
                  step={1}
                  value={[config.minMemory]}
                  onValueChange={([value]) => handleFieldChange('minMemory', value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maxMemory">Maximum Heap (-Xmx)</Label>
                  <span className="text-sm font-medium">{config.maxMemory} GB</span>
                </div>
                <Slider
                  id="maxMemory"
                  min={1}
                  max={32}
                  step={1}
                  value={[config.maxMemory]}
                  onValueChange={([value]) => handleFieldChange('maxMemory', value)}
                />
              </div>

              {config.minMemory > config.maxMemory && (
                <div className="flex items-start gap-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span>Minimum heap cannot exceed maximum heap</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Garbage Collector Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Garbage Collector</CardTitle>
              <CardDescription>
                Choose the garbage collection algorithm
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>GC Type</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('gcType', 'G1GC')}
                    className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 transition-colors ${
                      config.gcType === 'G1GC'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">G1GC</div>
                      <Badge variant="secondary">Default</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground text-left">
                      Balanced performance, suitable for most servers
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFieldChange('gcType', 'ZGC')}
                    className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 transition-colors ${
                      config.gcType === 'ZGC'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">ZGC</div>
                      <Badge variant="secondary">High Performance</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground text-left">
                      Low latency, best for large servers
                    </p>
                  </button>
                </div>
              </div>

              {config.gcType === 'G1GC' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maxGCPause">Max GC Pause Time</Label>
                    <span className="text-sm font-medium">{config.maxGCPauseMillis} ms</span>
                  </div>
                  <Slider
                    id="maxGCPause"
                    min={50}
                    max={1000}
                    step={10}
                    value={[config.maxGCPauseMillis]}
                    onValueChange={([value]) => handleFieldChange('maxGCPauseMillis', value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Target maximum pause time for garbage collection (lower = smoother gameplay)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Optimizations</CardTitle>
              <CardDescription>
                Fine-tune JVM performance features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="parallelRefProc">Parallel Reference Processing</Label>
                  <p className="text-xs text-muted-foreground">
                    Process references in parallel during GC (improves performance)
                  </p>
                </div>
                <Switch
                  id="parallelRefProc"
                  checked={config.parallelRefProc}
                  onCheckedChange={(checked) => handleFieldChange('parallelRefProc', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="useAOTCache">AOT Compilation Cache</Label>
                  <p className="text-xs text-muted-foreground">
                    Use ahead-of-time compilation cache for faster startup
                  </p>
                </div>
                <Switch
                  id="useAOTCache"
                  checked={config.useAOTCache}
                  onCheckedChange={(checked) => handleFieldChange('useAOTCache', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
              <CardDescription>
                Enable or disable optional features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableBackups">Automatic Backups</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable automatic world backups
                  </p>
                </div>
                <Switch
                  id="enableBackups"
                  checked={config.enableBackups}
                  onCheckedChange={(checked) => handleFieldChange('enableBackups', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableSentry">Error Tracking (Sentry)</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable error tracking and crash reporting
                  </p>
                </div>
                <Switch
                  id="enableSentry"
                  checked={config.enableSentry}
                  onCheckedChange={(checked) => handleFieldChange('enableSentry', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom JVM Flags</CardTitle>
              <CardDescription>
                Add custom JVM command-line flags
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={config.customFlags}
                onChange={(e) => handleFieldChange('customFlags', e.target.value)}
                placeholder="-XX:+UseStringDeduplication -XX:+OptimizeStringConcat"
                rows={4}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Space-separated JVM flags. Advanced users only.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Presets */}
        <TabsContent value="presets" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {(Object.entries(JVM_PRESETS) as [JVMPreset, typeof JVM_PRESETS[JVMPreset]][]).map(([key, preset]) => (
              <Card key={key} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{preset.name}</CardTitle>
                    <Badge variant="outline">
                      {preset.config.maxMemory}GB
                    </Badge>
                  </div>
                  <CardDescription>{preset.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Memory:</span>
                      <span className="font-medium">
                        {preset.config.minMemory}GB - {preset.config.maxMemory}GB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GC Type:</span>
                      <span className="font-medium">{preset.config.gcType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max GC Pause:</span>
                      <span className="font-medium">{preset.config.maxGCPauseMillis}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AOT Cache:</span>
                      <span className="font-medium">{preset.config.useAOTCache ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleApplyPreset(key)}
                    disabled={isSaving}
                    className="w-full"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Apply Preset
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Flags Comparison */}
      {flagsChanged && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Configuration Changes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Current Flags:</Label>
              <div className="rounded-md bg-muted p-3 font-mono text-xs break-all">
                {currentFlags || 'None'}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Pending Flags:</Label>
              <div className="rounded-md bg-primary/10 p-3 font-mono text-xs break-all border border-primary/20">
                {pendingFlags}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          disabled={!hasChanges || isSaving || config.minMemory > config.maxMemory}
          size="lg"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
