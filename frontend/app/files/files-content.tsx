'use client';

import { useEffect, useState } from 'react';
import { Folder, FileIcon, Upload, Download, Trash2, RefreshCcw, AlertCircle } from '@/lib/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface FileEntry {
  name: string;
  isDirectory: boolean;
  size: number;
  modified: string;
}

export function FilesContent() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState('/data');
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/server/files?path=${encodeURIComponent(path)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch files');
      }
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [path]);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const navigateTo = (entry: FileEntry) => {
    if (entry.isDirectory) {
      setPath(`${path}/${entry.name}`);
    }
  };

  const goUp = () => {
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    setPath('/' + parts.join('/'));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">File Manager</h1>
          <p className="text-muted-foreground">Manage server files</p>
        </div>
        <Button onClick={fetchFiles} variant="outline" size="sm">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Folder className="w-4 h-4" />
              {path}
            </CardTitle>
            {path !== '/data' && (
              <Button variant="ghost" size="sm" onClick={goUp}>
                Go Up
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-destructive">{error}</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No files found</div>
          ) : (
            <div className="space-y-1">
              {files.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer"
                  onClick={() => navigateTo(entry)}
                >
                  <div className="flex items-center gap-3">
                    {entry.isDirectory ? (
                      <Folder className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <FileIcon className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span>{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {!entry.isDirectory && <span>{formatSize(entry.size)}</span>}
                    <span>{entry.modified}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
