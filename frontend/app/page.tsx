'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';
import { Lock, Copy, Check, Users, Activity, Eye, EyeOff, Home, LogOut } from '@/lib/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';

// Dynamically import heavy background component
const ConstellationBackground = dynamic(
  () => import('@/components/background').then(mod => mod.ConstellationBackground),
  { ssr: false }
);

interface ServerStatus {
  online: boolean;
  status: 'online' | 'offline' | 'starting' | 'stopping';
  players: { online: number; max: number; list: any[] };
  performance: { tps: number; mspt: number };
  version: string | null;
  motd: string | null;
  timestamp: number;
}

export default function HomePage() {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    fetchServerStatus();
    
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data?.user) {
          setIsLoggedIn(true);
          setUserImage(data.user.image);
          setUsername(data.user.username || '');
          setIsUnlocked(true);
          fetchServerInfo();
        }
      })
      .catch(() => {});

    const savedPassword = document.cookie
      .split('; ')
      .find(row => row.startsWith('server_access='))
      ?.split('=')[1];
    
    if (savedPassword) {
      setPassword(savedPassword);
      verifyPassword(savedPassword, true);
    }

    const statusInterval = setInterval(fetchServerStatus, 30000);
    return () => clearInterval(statusInterval);
  }, []);

  const fetchServerStatus = async () => {
    try {
      const res = await fetch('/api/server/public');
      const data = await res.json();
      setServerStatus(data);
    } catch (error) {
      console.error('Failed to fetch server status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchServerInfo = async () => {
    try {
      const res = await fetch('/api/server/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: '' }),
      });
      const data = await res.json();
      if (res.ok) {
        setServerInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch server info:', error);
    }
  };

  const verifyPassword = async (pwd: string, fromCookie = false) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/server/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      });

      const data = await response.json();

      if (response.ok) {
        setServerInfo(data);
        setIsUnlocked(true);
        if (!fromCookie) {
          toast.success('Access granted!');
        }
      }
    } catch (error) {
      if (fromCookie) {
        console.log('Saved password no longer valid');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyPassword(password, false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOnline = serverStatus?.online && serverStatus?.status === 'online';

  return (
    <ConstellationBackground>
    <div className="relative min-h-screen w-full overflow-hidden text-foreground">

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 dark:border-white/10 bg-white dark:bg-black/20 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Logo size={32} showText={true} />
          </div>

          <nav className="flex items-center gap-2 sm:gap-4">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-2">
                  {userImage && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userImage} alt={username} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="hover:bg-accent">
                      <Home className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="hover:bg-accent"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Admin Login
                </Button>
              </Link>
            )}

            <ThemeToggle className="h-9 w-9" />
          </nav>
        </div>
      </header>

      {/* Server Status Banner */}
      <div className="relative z-10 bg-black/40 backdrop-blur-md border-b border-border/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-3">
            {statusLoading ? (
              <Activity className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">
                  Server is {isOnline ? 'Online' : 'Offline'}
                </span>
                {isOnline && serverStatus && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">
                      {serverStatus.players.online}/{serverStatus.players.max} players
                    </span>
                    {serverStatus.version && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          v{serverStatus.version}
                        </span>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

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
            <p className="text-lg text-black dark:text-muted-foreground drop-shadow text-center">
              Welcome, adventurer!
            </p>
          </div>

          {/* Password form or server info */}
          {!isUnlocked ? (
            <Card className="border-border/50 dark:border-white/20 bg-black/80 backdrop-blur-md shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Lock className="h-5 w-5" />
                  Server Access
                </CardTitle>
                <CardDescription className="text-white/80">
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
                      className="pr-10 bg-white text-black placeholder:text-gray-500"
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
                    className="w-full bg-white text-black hover:bg-gray-200"
                    disabled={isLoading || !password}
                  >
                    {isLoading ? 'Verifying...' : 'Unlock Server Info'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50 dark:border-white/20 bg-black/80 backdrop-blur-md shadow-lg">
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
                <CardDescription className="text-white/80">
                  Connect to the server using the details below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Direct Connect address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Direct Connect</label>
                  <div className="flex gap-2">
                    <Input
                      value={serverInfo ? `${serverInfo.address}:${serverInfo.port}` : 'Loading...'}
                      readOnly
                      className="font-mono bg-white text-black"
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
