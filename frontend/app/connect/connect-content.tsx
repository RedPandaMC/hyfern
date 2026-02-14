'use client';

import { useState, useEffect } from 'react';
import { Session } from 'next-auth';
import { Eye, EyeOff, Copy, Check, Server, Lock, Shield } from '@/lib/icons';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ServerInfo {
  address: string;
  port: number;
  version: string;
  maxPlayers: number;
}

interface ConnectContentProps {
  initialSession: Session | null;
}

export function ConnectContent({ initialSession }: ConnectContentProps) {
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [accessPassword, setAccessPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(!!initialSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Auto-fetch for authenticated users
  useEffect(() => {
    if (initialSession && !serverInfo) {
      handleUnlock(null);
    }
  }, [initialSession]);

  const handleUnlock = async (password: string | null = accessPassword) => {
    if (!initialSession && !password) {
      setError('Please enter the access password');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/server/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid password');
      }

      const data = await response.json();
      setServerInfo(data);
      setIsUnlocked(true);
      if (!initialSession) {
        toast.success('Connection info unlocked!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock');
      if (!initialSession) {
        toast.error('Failed to unlock connection info');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => handleCopy(text, field)}
      className="border-border hover:bg-accent"
    >
      {copiedField === field ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </Button>
  );

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="p-8 bg-card ">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Protected Content
            </h2>
            <p className="text-muted-foreground">
              Enter the server access password to view connection information
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-foreground">
                Access Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password..."
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                className="bg-secondary border-border text-foreground"
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <Button
              onClick={handleUnlock}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Unlocking...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Unlock
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!serverInfo) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Banner */}
      <Card className="p-4 bg-green-500/10 border-green-500/20">
        <div className="flex items-center gap-3">
          <Check className="w-5 h-5 text-green-500" />
          <p className="text-green-500">
            Connection information unlocked successfully
          </p>
        </div>
      </Card>

      {/* Server Address */}
      <Card className="p-6 bg-card ">
        <div className="flex items-center gap-3 mb-4">
          <Server className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Server Address</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-muted-foreground text-sm">IP Address</Label>
              <div className="text-2xl font-mono font-bold text-foreground">
                {serverInfo.address}
              </div>
            </div>
            <CopyButton text={serverInfo.address} field="address" />
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-muted-foreground text-sm">Port</Label>
              <div className="text-2xl font-mono font-bold text-foreground">
                {serverInfo.port}
              </div>
            </div>
            <CopyButton text={serverInfo.port.toString()} field="port" />
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-muted-foreground text-sm">Full Address</Label>
              <div className="text-xl font-mono font-bold text-primary">
                {serverInfo.address}:{serverInfo.port}
              </div>
            </div>
            <CopyButton
              text={`${serverInfo.address}:${serverInfo.port}`}
              field="full"
            />
          </div>
        </div>
      </Card>

      {/* Server Info */}
      <Card className="p-6 bg-card ">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Server Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground text-sm">Version</Label>
            <div className="text-lg font-semibold text-foreground">
              {serverInfo.version}
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Max Players</Label>
            <div className="text-lg font-semibold text-foreground">
              {serverInfo.maxPlayers}
            </div>
          </div>
        </div>
      </Card>

      {/* How to Connect */}
      <Card className="p-6 bg-card ">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          How to Connect
        </h3>
        <ol className="space-y-3 text-gray-300">
          <li className="flex gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              1
            </span>
            <span>Launch Hytale and navigate to Multiplayer</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              2
            </span>
            <span>
              Click "Add Server" and enter the server address:{' '}
              <code className="px-2 py-1 rounded bg-secondary text-primary font-mono">
                {serverInfo.address}:{serverInfo.port}
              </code>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              3
            </span>
            <span>Join and enjoy!</span>
          </li>
        </ol>
      </Card>
    </div>
  );
}
