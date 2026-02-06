'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { RefreshCcw, Package, Download } from 'lucide-react';
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
import type { CurseForgeMod } from '@/types/curseforge';

interface InstalledMod {
  id: string;
  curseforgeId: number;
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
  const [installing, setInstalling] = useState(false);
  const [selectedMod, setSelectedMod] = useState<CurseForgeMod | null>(null);
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [restartRequired, setRestartRequired] = useState(false);

  useEffect(() => {
    fetchInstalledMods();
  }, []);

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

  const handleInstallClick = async (mod: CurseForgeMod) => {
    // Check if already installed
    const isInstalled = installedMods.some((m) => m.curseforgeId === mod.id);
    if (isInstalled) {
      toast.error('This mod is already installed');
      return;
    }

    // Get the latest file
    const latestFile = mod.latestFiles[0];
    if (!latestFile) {
      toast.error('No files available for this mod');
      return;
    }

    setSelectedMod(mod);
    setSelectedFile(latestFile.id);
    setShowInstallDialog(true);
  };

  const handleConfirmInstall = async () => {
    if (!selectedMod || !selectedFile) return;

    try {
      setInstalling(true);

      const response = await fetch('/api/mods/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modId: selectedMod.id,
          fileId: selectedFile,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to install mod');
      }

      const data = await response.json();

      // Show success message
      toast.success(`${selectedMod.name} installed successfully!`);

      // Show warnings if any
      if (data.warnings?.missingDependencies?.length > 0) {
        toast.warning(
          `Missing dependencies: ${data.warnings.missingDependencies.join(', ')}`,
          { duration: 10000 }
        );
      }

      // Refresh installed mods list
      await fetchInstalledMods();

      // Set restart required flag
      setRestartRequired(true);

      // Close dialog
      setShowInstallDialog(false);
      setSelectedMod(null);
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to install mod:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to install mod');
    } finally {
      setInstalling(false);
    }
  };

  const handleUninstall = async (modId: string) => {
    try {
      const response = await fetch('/api/mods/installed', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
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

  return (
    <div className="space-y-6">
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
        <Card className="p-4 bg-[#0C1222] border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Installed</p>
              <p className="text-2xl font-bold text-white">
                {installedMods.length}
              </p>
            </div>
            <Package className="w-8 h-8 text-[#00D4AA]" />
          </div>
        </Card>

        <Card className="p-4 bg-[#0C1222] border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Core Plugins</p>
              <p className="text-2xl font-bold text-white">
                {installedMods.filter((m) => m.isCore).length}
              </p>
            </div>
            <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
              Protected
            </Badge>
          </div>
        </Card>

        <Card className="p-4 bg-[#0C1222] border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Custom Mods</p>
              <p className="text-2xl font-bold text-white">
                {installedMods.filter((m) => !m.isCore).length}
              </p>
            </div>
            <Download className="w-8 h-8 text-[#00D4AA]" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList className="bg-[#1a1f35] border border-gray-800">
          <TabsTrigger value="browse">Browse Mods</TabsTrigger>
          <TabsTrigger value="installed">
            Installed ({installedMods.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <ModBrowser
            onInstall={handleInstallClick}
            installedModIds={installedMods.map((m) => m.curseforgeId)}
          />
        </TabsContent>

        <TabsContent value="installed" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
            </div>
          ) : (
            <InstalledMods mods={installedMods} onUninstall={handleUninstall} />
          )}
        </TabsContent>
      </Tabs>

      {/* Install Confirmation Dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="bg-[#0C1222] border-gray-800">
          <DialogHeader>
            <DialogTitle>Install Mod</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to install{' '}
              <span className="font-semibold text-white">
                {selectedMod?.name}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2 text-sm text-gray-400">
            <p>This will:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Download the mod from CurseForge</li>
              <li>Install it to the server's mods folder</li>
              <li>Require a server restart to load the mod</li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInstallDialog(false)}
              className="border-gray-700"
              disabled={installing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmInstall}
              disabled={installing}
              className="bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#0C1222]"
            >
              {installing ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-[#0C1222] border-t-transparent" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Install
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
