'use client';

import { useState } from 'react';
import { Trash2, Lock, ExternalLink, AlertTriangle } from '@/lib/icons';
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

interface InstalledModsProps {
  mods: InstalledMod[];
  onUninstall: (modId: string) => Promise<void>;
}

export function InstalledMods({ mods, onUninstall }: InstalledModsProps) {
  const [uninstalling, setUninstalling] = useState<string | null>(null);
  const [selectedMod, setSelectedMod] = useState<InstalledMod | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleUninstallClick = (mod: InstalledMod) => {
    setSelectedMod(mod);
    setShowConfirmDialog(true);
  };

  const handleConfirmUninstall = async () => {
    if (!selectedMod) return;

    try {
      setUninstalling(selectedMod.id);
      await onUninstall(selectedMod.id);
      setShowConfirmDialog(false);
      setSelectedMod(null);
    } catch (error) {
      console.error('Failed to uninstall mod:', error);
    } finally {
      setUninstalling(null);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (mods.length === 0) {
    return (
      <Card className="p-12 bg-[#0C1222] border-gray-800">
        <div className="text-center">
          <p className="text-gray-400">No mods installed</p>
          <p className="text-sm text-gray-500 mt-2">
            Browse mods above to get started
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {mods.map((mod) => (
          <Card key={mod.id} className="p-4 bg-[#0C1222] border-gray-800">
            <div className="flex items-center justify-between">
              {/* Mod Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-white truncate">
                    {mod.name}
                  </h4>
                  {mod.isCore && (
                    <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                      <Lock className="w-3 h-3 mr-1" />
                      Core
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                  <span>Version: {mod.version}</span>
                  <span>•</span>
                  <span>Installed by {mod.installer.username}</span>
                  <span>•</span>
                  <span>{formatDate(mod.installedAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                {mod.curseforgeId != null && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://www.curseforge.com/hytale/mods/${mod.slug}`,
                        '_blank'
                      )
                    }
                    className="border-gray-700 hover:bg-gray-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}

                {mod.isCore ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="border-gray-700 cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Protected
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUninstallClick(mod)}
                    disabled={uninstalling === mod.id}
                    className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50"
                  >
                    {uninstalling === mod.id ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                        Uninstalling...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Uninstall
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-[#0C1222] border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              Uninstall Mod
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to uninstall{' '}
              <span className="font-semibold text-white">
                {selectedMod?.name}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2 text-sm text-gray-400">
            <p>This will:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Remove the mod file from the server</li>
              <li>Delete the installation record</li>
              <li>Require a server restart to take effect</li>
            </ul>
            <p className="text-yellow-500 mt-4">
              ⚠️ This action cannot be undone. Make sure no other mods depend
              on this mod.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="border-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUninstall}
              disabled={uninstalling !== null}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {uninstalling ? 'Uninstalling...' : 'Uninstall'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
