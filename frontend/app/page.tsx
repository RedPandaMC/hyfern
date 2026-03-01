'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/logo';
import { Lock, Copy, Check, Users, Activity, ExternalLink, Eye, EyeOff } from '@/lib/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';

// Dynamically import heavy background component
const ConstellationBackground = dynamic(
  () => import('@/components/background').then(mod => mod.ConstellationBackground),
  { ssr: false }
);

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
    <ConstellationBackground>
    <div className="relative min-h-screen w-full overflow-hidden text-foreground">
      {/* Overlay for text readability - lighter in light mode */}
      <div className="absolute inset-0 bg-white/20 dark:bg-black/30" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 dark:border-white/10 bg-white/90 dark:bg-black/20 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Logo size={32} showText={true} />
          </div>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link href={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://grafana.hyfern.us'}`} target="_blank" rel="noopener noreferrer" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="hover:bg-accent">
                <Activity className="mr-2 h-4 w-4" />
                Analytics
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </Link>

            <ThemeToggle className="h-9 w-9" />
            <Link href="/login">
              <Button variant="outline" size="sm">
                Admin Login
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Welcome Section */}
          <div className="flex flex-col items-center gap-8">
            <div className="text-center space-y-6">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-4xl font-bitter font-bold drop-shadow-lg">Welcome to</span>
                  <span className="text-2xl sm:text-4xl font-bitter font-bold drop-shadow-lg">HyFern</span>
                  <Logo size={48} showText={false} />
                </div>
              </div>
            </div>
            <p className="text-lg text-muted-foreground drop-shadow text-center">
              Welcome, adventurer!
            </p>
          </div>

          {/* Password form or server info */}
          {!isUnlocked ? (
            <Card className="border-border/50 dark:border-white/20 bg-white/95 dark:bg-black/40 backdrop-blur-md shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                  <Lock className="h-5 w-5" />
                  Server Access
                </CardTitle>
                <CardDescription>
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
                      className="pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                    className="w-full"
                    disabled={isLoading || !password}
                  >
                    {isLoading ? 'Verifying...' : 'Unlock Server Info'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50 dark:border-white/20 bg-white/95 dark:bg-black/40 backdrop-blur-md shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Server Information</CardTitle>
                  {serverInfo?.status && (
                    <Badge
                      variant={serverInfo.status === 'online' ? 'default' : 'destructive'}
                      className={serverInfo.status === 'online' ? 'bg-green-500' : ''}
                    >
                      {serverInfo.status === 'online' ? 'Online' : 'Offline'}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Connect to the server using the details below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Direct Connect address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Direct Connect</label>
                  <div className="flex gap-2">
                    <Input
                      value={serverInfo ? `${serverInfo.address}:${serverInfo.port}` : 'Loading...'}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(`${serverInfo?.address}:${serverInfo?.port}`, 'Address')}
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Server stats */}
                {serverInfo?.players !== undefined && (
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span>Players Online</span>
                    </div>
                    <span className="text-xl font-bold text-primary">
                      {serverInfo.players}/{serverInfo.maxPlayers || '?'}
                    </span>
                  </div>
                )}

                <p className="text-center text-sm text-muted-foreground">
                  See you in-game, adventurer!
                </p>
                <p className="text-center text-sm text-muted-foreground">
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
      <footer className="relative z-10 border-t border-border/50 dark:border-white/10 bg-white/90 dark:bg-black/20 py-4 backdrop-blur-md">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} HyFern. Powered by Hytale.
        </p>
      </footer>
    </div>
    </ConstellationBackground>
  );
}
