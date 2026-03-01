'use client';

import { useEffect, useState } from 'react';
import { Database, Upload, Download, Trash2, RefreshCcw, AlertCircle, Clock } from '@/lib/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Backup {
  id: number;
  filename: string;
  size: number;
  createdAt: string;
}

export function BackupsContent() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBackups = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/server/backups');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch backups');
      }
      const data = await res.json();
      setBackups(data.backups || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const createBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/server/backups', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create backup');
      }
      toast.success('Backup created successfully');
      fetchBackups();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (id: number) => {
    if (!confirm('Are you sure you want to restore this backup? Current data will be overwritten.')) {
      return;
    }
    setRestoring(id);
    try {
      const res = await fetch(`/api/server/backups/${id}/restore`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to restore backup');
      }
      toast.success('Backup restored successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to restore backup');
    } finally {
      setRestoring(null);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backups</h1>
          <p className="text-muted-foreground">Manage server backups</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchBackups} variant="outline" size="sm">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={createBackup} disabled={creating}>
            <Upload className="w-4 h-4 mr-2" />
            {creating ? 'Creating...' : 'Create Backup'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Server Backups
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-destructive">{error}</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No backups found</p>
              <p className="text-sm text-muted-foreground mt-2">Create a backup to protect your server data</p>
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Database className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{backup.filename}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(backup.createdAt).toLocaleString()}
                        </span>
                        <span>{formatSize(backup.size)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restoreBackup(backup.id)}
                    disabled={restoring !== null}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {restoring === backup.id ? 'Restoring...' : 'Restore'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
