'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Copy, Check, Server, Lock, Shield } from '@/lib/icons';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ServerInfo {
  address: string;
  port: number;
  password: string;
  version: string;
  maxPlayers: number;
}

export function ConnectContent() {
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [accessPassword, setAccessPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleUnlock = async () => {
    if (!accessPassword) {
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
        body: JSON.stringify({ password: accessPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid password');
      }

      const data = await response.json();
      setServerInfo(data);
      setIsUnlocked(true);
      toast.success('Connection info unlocked!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock');
      toast.error('Failed to unlock connection info');
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
      className="border-gray-700 hover:bg-gray-800"
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
        <Card className="p-8 bg-[#0C1222] border-gray-800">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00D4AA]/10 mb-4">
              <Lock className="w-8 h-8 text-[#00D4AA]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Protected Content
            </h2>
            <p className="text-gray-400">
              Enter the server access password to view connection information
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-white">
                Access Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password..."
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                className="bg-[#1a1f35] border-gray-700 text-white"
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
              className="w-full bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#0C1222]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-[#0C1222] border-t-transparent" />
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
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
      <Card className="p-6 bg-[#0C1222] border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <Server className="w-5 h-5 text-[#00D4AA]" />
          <h3 className="text-lg font-semibold text-white">Server Address</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-gray-400 text-sm">IP Address</Label>
              <div className="text-2xl font-mono font-bold text-white">
                {serverInfo.address}
              </div>
            </div>
            <CopyButton text={serverInfo.address} field="address" />
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-gray-400 text-sm">Port</Label>
              <div className="text-2xl font-mono font-bold text-white">
                {serverInfo.port}
              </div>
            </div>
            <CopyButton text={serverInfo.port.toString()} field="port" />
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-gray-400 text-sm">Full Address</Label>
              <div className="text-xl font-mono font-bold text-[#00D4AA]">
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

      {/* Server Password */}
      <Card className="p-6 bg-[#0C1222] border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 text-[#00D4AA]" />
          <h3 className="text-lg font-semibold text-white">Server Password</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={serverInfo.password}
                readOnly
                className="bg-[#1a1f35] border-gray-700 text-white font-mono pr-10"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <CopyButton text={serverInfo.password} field="password" />
        </div>
      </Card>

      {/* Server Info */}
      <Card className="p-6 bg-[#0C1222] border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">
          Server Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-400 text-sm">Version</Label>
            <div className="text-lg font-semibold text-white">
              {serverInfo.version}
            </div>
          </div>
          <div>
            <Label className="text-gray-400 text-sm">Max Players</Label>
            <div className="text-lg font-semibold text-white">
              {serverInfo.maxPlayers}
            </div>
          </div>
        </div>
      </Card>

      {/* How to Connect */}
      <Card className="p-6 bg-[#0C1222] border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">
          How to Connect
        </h3>
        <ol className="space-y-3 text-gray-300">
          <li className="flex gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D4AA] text-[#0C1222] text-sm font-bold">
              1
            </span>
            <span>Launch Hytale and navigate to Multiplayer</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D4AA] text-[#0C1222] text-sm font-bold">
              2
            </span>
            <span>
              Click "Add Server" and enter the server address:{' '}
              <code className="px-2 py-1 rounded bg-[#1a1f35] text-[#00D4AA] font-mono">
                {serverInfo.address}:{serverInfo.port}
              </code>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D4AA] text-[#0C1222] text-sm font-bold">
              3
            </span>
            <span>
              When prompted, enter the server password shown above
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D4AA] text-[#0C1222] text-sm font-bold">
              4
            </span>
            <span>Join and enjoy!</span>
          </li>
        </ol>
      </Card>
    </div>
  );
}
