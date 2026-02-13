'use client';

import { Download, Check, AlertCircle, Loader2 } from '@/lib/icons';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export interface DownloadProgress {
  id: string;
  modId: number;
  fileId: number;
  modName: string;
  fileName: string;
  stage: 'queued' | 'checking' | 'fetching' | 'preparing' | 'downloading' | 'validating' | 'uploading' | 'dependencies' | 'saving' | 'complete' | 'error';
  progress: number;
  message: string;
  downloaded?: number;
  fileSize?: number;
  error?: string;
}

interface DownloadProgressListProps {
  downloads: DownloadProgress[];
}

export function DownloadProgressList({ downloads }: DownloadProgressListProps) {
  if (downloads.length === 0) return null;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getStageLabel = (stage: DownloadProgress['stage']): string => {
    switch (stage) {
      case 'queued': return 'Queued';
      case 'checking': return 'Checking';
      case 'fetching': return 'Fetching Details';
      case 'preparing': return 'Preparing';
      case 'downloading': return 'Downloading';
      case 'validating': return 'Validating';
      case 'uploading': return 'Uploading';
      case 'dependencies': return 'Checking Dependencies';
      case 'saving': return 'Saving';
      case 'complete': return 'Complete';
      case 'error': return 'Error';
      default: return 'Processing';
    }
  };

  const getStageColor = (stage: DownloadProgress['stage']): string => {
    switch (stage) {
      case 'queued': return 'bg-secondary text-secondary-foreground';
      case 'complete': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'error': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  // Separate active, completed, and queued downloads
  const activeDownloads = downloads.filter(d =>
    d.stage !== 'complete' && d.stage !== 'error' && d.stage !== 'queued'
  );
  const queuedDownloads = downloads.filter(d => d.stage === 'queued');
  const completedDownloads = downloads.filter(d =>
    d.stage === 'complete' || d.stage === 'error'
  );

  return (
    <Card className="p-4 bg-card border-border">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">
            Downloads {activeDownloads.length > 0 && `(${activeDownloads.length} active)`}
          </h3>
          {queuedDownloads.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {queuedDownloads.length} queued
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          {/* Active Downloads */}
          {activeDownloads.map((download) => (
            <div key={download.id} className="space-y-2 p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="font-medium text-foreground truncate">
                      {download.modName}
                    </span>
                    <Badge className={getStageColor(download.stage)}>
                      {getStageLabel(download.stage)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {download.fileName}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium text-foreground">
                    {download.progress}%
                  </div>
                  {download.stage === 'downloading' && download.downloaded !== undefined && download.fileSize !== undefined && (
                    <div className="text-xs text-muted-foreground">
                      {formatBytes(download.downloaded)} / {formatBytes(download.fileSize)}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Progress value={download.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{download.message}</p>
              </div>
            </div>
          ))}

          {/* Queued Downloads */}
          {queuedDownloads.map((download) => (
            <div key={download.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Download className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground truncate">
                  {download.modName}
                </span>
                <Badge className={getStageColor(download.stage)}>
                  Queued
                </Badge>
              </div>
            </div>
          ))}

          {/* Completed Downloads (last 3) */}
          {completedDownloads.slice(-3).reverse().map((download) => (
            <div key={download.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {download.stage === 'complete' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                )}
                <span className="text-sm text-foreground truncate">
                  {download.modName}
                </span>
                <Badge className={getStageColor(download.stage)}>
                  {getStageLabel(download.stage)}
                </Badge>
              </div>
              {download.error && (
                <span className="text-xs text-destructive truncate max-w-[200px]">
                  {download.error}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
