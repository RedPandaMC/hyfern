'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { RefreshCcw, Package, Download, Upload, FileUp } from '@/lib/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ModBrowser } from '@/components/mods/mod-browser';
import { InstalledMods } from '@/components/mods/installed-mods';
import { ModDetailsDialog } from '@/components/mods/mod-details-dialog';
import { DownloadProgressList, type DownloadProgress } from '@/components/mods/download-progress';
import type { CurseForgeMod } from '@/types/curseforge';

interface InstalledMod {
  id: string;
  curseforgeId: number | null;
  name: string;
  slug: string;
  version: string;
  fileName: string;
  installedAt: string;
  installedBy: string;
  isCore: boolean;
  installer: {
    id: string;
    username: string;
    role: string;
  };
}

export function ModsContent() {
  const [installedMods, setInstalledMods] = useState<InstalledMod[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedMod, setSelectedMod] = useState<CurseForgeMod | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [restartRequired, setRestartRequired] = useState(false);
  const [curseforgeEnabled, setCurseforgeEnabled] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Download queue management
  const [downloads, setDownloads] = useState<DownloadProgress[]>([]);
  const [activeDownloadsCount, setActiveDownloadsCount] = useState(0);
  const MAX_PARALLEL_DOWNLOADS = 5;

  useEffect(() => {
    fetchInstalledMods();
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/mods/config');
      if (response.ok) {
        const data = await response.json();
        setCurseforgeEnabled(data.curseforgeEnabled);
      }
    } catch {
      // CurseForge unavailable, upload-only mode
    } finally {
      setConfigLoaded(true);
    }
  };

  const fetchInstalledMods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mods/installed');
      if (!response.ok) throw new Error('Failed to fetch installed mods');
      const data = await response.json();
      setInstalledMods(data.mods || []);
    } catch (error) {
      console.error('Failed to fetch installed mods:', error);
      toast.error('Failed to fetch installed mods');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (mod: CurseForgeMod) => {
    setSelectedMod(mod);
    setShowDetailsDialog(true);
  };

  const handleInstall = async (modId: number, fileId: number) => {
    if (!modId || !fileId) return;

    // Get mod info from selectedMod or fetch it
    const modName = selectedMod?.name || `Mod ${modId}`;
    const fileName = selectedMod?.latestFiles.find(f => f.id === fileId)?.fileName || 'Unknown';

    // Create download entry
    const downloadId = `${modId}-${fileId}-${Date.now()}`;
    const newDownload: DownloadProgress = {
      id: downloadId,
      modId,
      fileId,
      modName,
      fileName,
      stage: 'queued',
      progress: 0,
      message: 'Waiting in queue...',
    };

    setDownloads(prev => [...prev, newDownload]);
    setShowDetailsDialog(false);
    setSelectedMod(null);

    // Process queue
    processDownloadQueue();
  };

  const processDownloadQueue = useCallback(async () => {
    setDownloads(prev => {
      const queued = prev.filter(d => d.stage === 'queued');
      const active = prev.filter(d => d.stage !== 'queued' && d.stage !== 'complete' && d.stage !== 'error');

      // Start new downloads if under limit
      if (active.length < MAX_PARALLEL_DOWNLOADS && queued.length > 0) {
        const toStart = queued.slice(0, MAX_PARALLEL_DOWNLOADS - active.length);

        toStart.forEach(download => {
          startDownload(download.id, download.modId, download.fileId);
        });
      }

      return prev;
    });
  }, [MAX_PARALLEL_DOWNLOADS]);

  const startDownload = async (downloadId: string, modId: number, fileId: number) => {
    try {
      const response = await fetch('/api/mods/install-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modId, fileId }),
      });

      if (!response.ok) {
        throw new Error('Failed to start download');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            setDownloads(prev => prev.map(d =>
              d.id === downloadId
                ? {
                    ...d,
                    stage: data.stage,
                    progress: data.progress || d.progress,
                    message: data.message || d.message,
                    downloaded: data.downloaded,
                    fileSize: data.fileSize || d.fileSize,
                    error: data.error,
                  }
                : d
            ));

            if (data.stage === 'complete') {
              const modName = downloads.find(dl => dl.id === downloadId)?.modName || 'Mod';
              toast.success(`${modName} installed successfully!`);

              if (data.warnings?.missingDependencies?.length > 0) {
                toast.warning(
                  `Missing dependencies: ${data.warnings.missingDependencies.join(', ')}`,
                  { duration: 10000 }
                );
              }

              await fetchInstalledMods();
              setRestartRequired(true);
              processDownloadQueue(); // Start next in queue
            } else if (data.stage === 'error') {
              toast.error(`Failed to install: ${data.error}`);
              processDownloadQueue(); // Start next in queue
            }
          }
        }
      }
    } catch (error) {
      console.error('Download failed:', error);
      setDownloads(prev => prev.map(d =>
        d.id === downloadId
          ? { ...d, stage: 'error', error: error instanceof Error ? error.message : 'Download failed' }
          : d
      ));
      processDownloadQueue(); // Start next in queue
    }
  };

  const handleUninstall = async (modId: string) => {
    try {
      const response = await fetch('/api/mods/installed', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to uninstall mod');
      }

      toast.success('Mod uninstalled successfully');
      setRestartRequired(true);
      await fetchInstalledMods();
    } catch (error) {
      console.error('Failed to uninstall mod:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to uninstall mod');
    }
  };

  const uploadFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.jar')) {
      toast.error('Only .jar files are allowed');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('File too large (max 100MB)');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/mods/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload mod');
      }

      toast.success(`${file.name} uploaded successfully!`);
      await fetchInstalledMods();
      setRestartRequired(true);
    } catch (error) {
      console.error('Failed to upload mod:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload mod');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      uploadFile(file);
    }
  }, [uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      uploadFile(file);
    }
    e.target.value = '';
  };

  if (!configLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Download Progress */}
      {downloads.length > 0 && (
        <DownloadProgressList downloads={downloads} />
      )}

      {/* Restart Required Banner */}
      {restartRequired && (
        <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCcw className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="font-semibold text-yellow-500">
                  Server Restart Required
                </p>
                <p className="text-sm text-yellow-500/80">
                  Mod changes will take effect after the server restarts
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Installed</p>
              <p className="text-2xl font-bold text-foreground">
                {installedMods.length}
              </p>
            </div>
            <Package className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Core Plugins</p>
              <p className="text-2xl font-bold text-foreground">
                {installedMods.filter((m) => m.isCore).length}
              </p>
            </div>
            <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
              Protected
            </Badge>
          </div>
        </Card>

        <Card className="p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Custom Mods</p>
              <p className="text-2xl font-bold text-foreground">
                {installedMods.filter((m) => !m.isCore).length}
              </p>
            </div>
            <Download className="w-8 h-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={curseforgeEnabled ? 'browse' : 'upload'} className="space-y-6">
        <TabsList className="bg-secondary border border-border">
          {curseforgeEnabled && (
            <TabsTrigger value="browse">Browse Mods</TabsTrigger>
          )}
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="installed">
            Installed ({installedMods.length})
          </TabsTrigger>
        </TabsList>

        {curseforgeEnabled && (
          <TabsContent value="browse" className="space-y-6">
            <ModBrowser
              onViewDetails={handleViewDetails}
              installedModIds={installedMods
                .filter((m) => m.curseforgeId != null)
                .map((m) => m.curseforgeId!)}
            />
          </TabsContent>
        )}

        <TabsContent value="upload" className="space-y-6">
          <Card
            className={`p-8 bg-card border-2 border-dashed transition-colors ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/30'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex flex-col items-center justify-center py-8 text-center">
              {uploading ? (
                <>
                  <div className="w-12 h-12 mb-4 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-lg font-semibold text-foreground">Uploading...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Installing mod to server
                  </p>
                </>
              ) : (
                <>
                  <FileUp className="w-12 h-12 mb-4 text-muted-foreground" />
                  <p className="text-lg font-semibold text-foreground">
                    Drag &amp; drop mod files here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse. Only .jar files, max 100MB.
                  </p>
                  <label>
                    <input
                      type="file"
                      accept=".jar"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      className="mt-4 border-border"
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Files
                      </span>
                    </Button>
                  </label>
                </>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="installed" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <InstalledMods mods={installedMods} onUninstall={handleUninstall} />
          )}
        </TabsContent>
      </Tabs>

      {/* Mod Details Dialog */}
      <ModDetailsDialog
        mod={selectedMod}
        open={showDetailsDialog}
        onClose={() => {
          setShowDetailsDialog(false);
          setSelectedMod(null);
        }}
        onInstall={handleInstall}
        installing={false}
        isInstalled={selectedMod ? installedMods.some((m) => m.curseforgeId === selectedMod.id) : false}
      />
    </div>
  );
}
