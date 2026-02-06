'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Copy, Check, Users, Activity, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function HomePage() {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isDaytime, setIsDaytime] = useState(true);

  // Determine if it's day or night based on local time
  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      // Day: 6 AM - 6 PM (6-18), Night: 6 PM - 6 AM (18-6)
      setIsDaytime(hour >= 6 && hour < 18);
    };

    checkTime();
    // Check every minute in case user keeps page open across day/night transition
    const interval = setInterval(checkTime, 60000);

    return () => clearInterval(interval);
  }, []);

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
      {/* Background image with transition */}
      <div className="absolute inset-0 transition-opacity duration-1000">
        <Image
          src={isDaytime ? '/day.jpg' : '/night.jpg'}
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={100}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

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
                {isDaytime ? 'Good day, adventurer!' : 'Good evening, adventurer!'}
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
                  <Input
                    type="password"
                    placeholder="Enter password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
                    disabled={isLoading}
                  />
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
