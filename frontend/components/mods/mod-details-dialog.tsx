'use client';

import { useState, useEffect } from 'react';
import { Download, ExternalLink, Check, AlertCircle, ChevronDown, Package } from '@/lib/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatFileSize, getReleaseTypeLabel, getReleaseTypeColor } from '@/lib/curseforge';
import type { CurseForgeMod, CurseForgeFile } from '@/types/curseforge';

interface ModDetailsDialogProps {
  mod: CurseForgeMod | null;
  open: boolean;
  onClose: () => void;
  onInstall: (modId: number, fileId: number) => void;
  installing: boolean;
  isInstalled: boolean;
}

export function ModDetailsDialog({
  mod,
  open,
  onClose,
  onInstall,
  installing,
  isInstalled,
}: ModDetailsDialogProps) {
  const [files, setFiles] = useState<CurseForgeFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllVersions, setShowAllVersions] = useState(false);

  useEffect(() => {
    if (mod && open) {
      fetchFiles();
    } else {
      // Reset state when dialog closes
      setFiles([]);
      setSelectedFileId(null);
      setError(null);
      setShowAllVersions(false);
    }
  }, [mod, open]);

  const fetchFiles = async () => {
    if (!mod) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/mods/${mod.id}/files?pageSize=50`);
      if (!response.ok) throw new Error('Failed to fetch mod files');

      const data = await response.json();
      setFiles(data.data || []);

      // Auto-select the latest file
      if (data.data && data.data.length > 0) {
        setSelectedFileId(data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch mod files:', err);
      setError('Failed to load mod versions');
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = () => {
    if (!mod || !selectedFileId) return;
    onInstall(mod.id, selectedFileId);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDownloads = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (!mod) return null;

  const selectedFile = files.find(f => f.id === selectedFileId);
  const displayedFiles = showAllVersions ? files : files.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-card">
        <DialogHeader>
          <div className="flex items-start gap-4">
            {/* Mod Logo */}
            {mod.logo ? (
              <div className="flex-shrink-0">
                <img
                  src={mod.logo.url}
                  alt={mod.name}
                  className="w-24 h-24 rounded-lg object-cover border border-border"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center border border-border">
                <span className="text-4xl">📦</span>
              </div>
            )}

            {/* Mod Info */}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl">{mod.name}</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1">
                by {mod.authors[0]?.name || 'Unknown'}
              </DialogDescription>

              {/* Stats Row */}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  <span>{formatDownloads(mod.downloadCount)} downloads</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  <span>Updated {formatDate(mod.dateModified)}</span>
                </div>
              </div>

              {/* Categories */}
              {mod.categories && mod.categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {mod.categories.slice(0, 5).map((category) => (
                    <Badge key={category.id} variant="outline" className="text-xs">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            <div>
              <h3 className="font-semibold text-foreground mb-2">About</h3>
              <p className="text-sm text-muted-foreground">{mod.summary}</p>
            </div>

            {/* Version Selection */}
            <div>
              <h3 className="font-semibold text-foreground mb-2">Select Version</h3>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 text-destructive text-sm py-4">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No versions available
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {displayedFiles.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => setSelectedFileId(file.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedFileId === file.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-foreground truncate">
                                {file.displayName}
                              </span>
                              <Badge className={getReleaseTypeColor(file.releaseType)}>
                                {getReleaseTypeLabel(file.releaseType)}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Download className="w-3 h-3" />
                                {formatDate(file.fileDate)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {formatFileSize(file.fileLength)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Download className="w-3 h-3" />
                                {formatDownloads(file.downloadCount)}
                              </div>
                            </div>

                            {/* Game Versions */}
                            {file.gameVersions && file.gameVersions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {file.gameVersions.slice(0, 3).map((version, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {version}
                                  </Badge>
                                ))}
                                {file.gameVersions.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{file.gameVersions.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Dependencies Warning */}
                            {file.dependencies.filter(d => d.relationType === 3).length > 0 && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-yellow-500">
                                <AlertCircle className="w-3 h-3" />
                                Requires {file.dependencies.filter(d => d.relationType === 3).length} dependencies
                              </div>
                            )}
                          </div>

                          {selectedFileId === file.id && (
                            <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Show More Button */}
                  {files.length > 5 && (
                    <Button
                      variant="ghost"
                      onClick={() => setShowAllVersions(!showAllVersions)}
                      className="w-full mt-2"
                    >
                      <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showAllVersions ? 'rotate-180' : ''}`} />
                      {showAllVersions ? 'Show Less' : `Show ${files.length - 5} More Versions`}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => window.open(mod.links.websiteUrl, '_blank')}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View on CurseForge
          </Button>
          <Button variant="outline" onClick={onClose} disabled={installing}>
            Cancel
          </Button>
          {isInstalled ? (
            <Button disabled className="gap-2">
              <Check className="w-4 h-4" />
              Already Installed
            </Button>
          ) : (
            <Button
              onClick={handleInstall}
              disabled={!selectedFileId || installing || loading}
              className="gap-2"
            >
              {installing ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Install {selectedFile ? selectedFile.displayName : 'Selected Version'}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
