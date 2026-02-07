'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Copy, Check, Users, Activity, ExternalLink, Eye, EyeOff } from '@/lib/icons';
import { toast } from 'sonner';

export default function HomePage() {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/server/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Invalid password');
        return;
      }

      setServerInfo(data);
      setIsUnlocked(true);
      toast.success('Access granted!');
    } catch (error) {
      toast.error('Failed to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Overlay for text readability over ANSI background */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="HyFern" width={32} height={32} />
            <span className="text-xl font-bold text-white">HyFern</span>
          </div>

          <nav className="flex items-center gap-4">
            <Link href="https://grafana.hyfern.us" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Activity className="mr-2 h-4 w-4" />
                Analytics
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </Link>
            <Link href="https://panel.hyfern.us" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                Panel
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                Admin Login
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <Image
              src="/logo.png"
              alt="HyFern Logo"
              width={120}
              height={120}
              className="drop-shadow-2xl"
            />
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">Welcome to HyFern</h1>
              <p className="mt-2 text-lg text-white/80 drop-shadow">
                Welcome, adventurer!
              </p>
            </div>
          </div>

          {/* Password form or server info */}
          {!isUnlocked ? (
            <Card className="border-white/20 bg-black/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Lock className="h-5 w-5" />
                  Server Access
                </CardTitle>
                <CardDescription className="text-white/70">
                  Enter the password to reveal server connection details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/50 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isLoading || !password}
                  >
                    {isLoading ? 'Verifying...' : 'Unlock Server Info'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-white/20 bg-black/40 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Server Information</CardTitle>
                  {serverInfo?.status && (
                    <Badge
                      variant={serverInfo.status === 'online' ? 'default' : 'destructive'}
                      className={serverInfo.status === 'online' ? 'bg-green-500' : ''}
                    >
                      {serverInfo.status === 'online' ? 'Online' : 'Offline'}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-white/70">
                  Connect to the server using the details below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Direct Connect address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90">Direct Connect</label>
                  <div className="flex gap-2">
                    <Input
                      value={serverInfo ? `${serverInfo.address}:${serverInfo.port}` : 'Loading...'}
                      readOnly
                      className="border-white/20 bg-white/10 text-white font-mono"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="border-white/20 bg-white/10 hover:bg-white/20"
                      onClick={() => copyToClipboard(`${serverInfo?.address}:${serverInfo?.port}`, 'Address')}
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-white" />}
                    </Button>
                  </div>
                </div>

                {/* Server stats */}
                {serverInfo?.players !== undefined && (
                  <div className="flex items-center justify-between rounded-lg border border-white/20 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-white">
                      <Users className="h-5 w-5" />
                      <span>Players Online</span>
                    </div>
                    <span className="text-xl font-bold text-primary">
                      {serverInfo.players}/{serverInfo.maxPlayers || '?'}
                    </span>
                  </div>
                )}

                <p className="text-center text-sm text-white/60">
                  See you in-game, adventurer!
                </p>
                <p className="text-center text-sm text-white/50">
                  Need help?{' '}
                  <a href="mailto:hyfern-admin@hyfern.us" className="text-primary hover:underline">
                    hyfern-admin@hyfern.us
                  </a>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20 py-4 backdrop-blur-md">
        <p className="text-center text-sm text-white/60">
          &copy; {new Date().getFullYear()} HyFern. Powered by Hytale.
        </p>
      </footer>
    </div>
  );
}
