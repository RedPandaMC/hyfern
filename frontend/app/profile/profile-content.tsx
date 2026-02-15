'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Key, Eye, EyeOff, AlertCircle, Check, Copy, Lock, Upload } from '@/lib/icons';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  username: string;
  role: string;
  avatarPath: string | null;
  totpEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { sessions: number };
}

export function ProfileContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setProfile(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center text-muted-foreground">
            Loading profile...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !profile) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <p className="text-muted-foreground">{error || 'Profile not found'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <AvatarUpload
              avatarPath={profile.avatarPath}
              username={profile.username}
              onUpload={(newPath) => setProfile({ ...profile, avatarPath: newPath })}
            />
            <div>
              <h3 className="text-lg font-semibold">{profile.username}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{profile.role}</Badge>
                {profile.totpEnabled && (
                  <Badge variant="default" className="bg-green-600">
                    <Shield className="mr-1 h-3 w-3" />
                    2FA Enabled
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Member since</span>
              <p className="font-medium">{new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Active sessions</span>
              <p className="font-medium">{profile._count.sessions}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <PasswordChangeCard />

      {/* 2FA Management */}
      <TwoFactorCard
        enabled={profile.totpEnabled}
        onUpdate={fetchProfile}
      />
    </div>
  );
}

function AvatarUpload({
  avatarPath,
  username,
  onUpload,
}: {
  avatarPath: string | null;
  username: string;
  onUpload: (newPath: string | null) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 2MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to upload avatar');
        return;
      }

      onUpload(data.avatarPath);
      toast.success('Profile picture updated!');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative group">
      <Avatar className="h-16 w-16">
        {avatarPath && <AvatarImage src={avatarPath} alt={username} />}
        <AvatarFallback className="bg-primary text-primary-foreground text-xl">
          {username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        <Upload className="h-5 w-5 text-white" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

function PasswordChangeCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to change password');
        return;
      }

      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Change Password
        </CardTitle>
        <CardDescription>Update your account password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? 'Changing...' : 'Change Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TwoFactorCard({ enabled, onUpdate }: { enabled: boolean; onUpdate: () => void }) {
  const [step, setStep] = useState<'idle' | 'setup' | 'verify' | 'recovery' | 'disable'>('idle');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile/2fa/setup', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to start 2FA setup');
        return;
      }

      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('setup');
    } catch {
      toast.error('Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async () => {
    if (token.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profile/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Invalid token');
        return;
      }

      setRecoveryCodes(data.recoveryCodes);
      setStep('recovery');
      toast.success('2FA enabled successfully!');
    } catch {
      toast.error('Failed to verify token');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!disablePassword) {
      toast.error('Password is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profile/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to disable 2FA');
        return;
      }

      toast.success('2FA disabled');
      setStep('idle');
      setDisablePassword('');
      onUpdate();
    } catch {
      toast.error('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    toast.success('Secret copied to clipboard');
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopiedCodes(true);
    toast.success('Recovery codes copied to clipboard');
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const finishSetup = () => {
    setStep('idle');
    setQrCode('');
    setSecret('');
    setToken('');
    setRecoveryCodes([]);
    onUpdate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          {enabled
            ? '2FA is enabled on your account'
            : 'Add an extra layer of security to your account'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'idle' && (
          <div className="space-y-4">
            {enabled ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-500">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Two-factor authentication is active</span>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setStep('disable')}
                >
                  Disable 2FA
                </Button>
              </div>
            ) : (
              <Button onClick={startSetup} disabled={loading}>
                {loading ? 'Setting up...' : 'Enable 2FA'}
              </Button>
            )}
          </div>
        )}

        {step === 'setup' && (
          <div className="space-y-6 max-w-md">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              {qrCode && (
                <div className="flex justify-center p-4 bg-white rounded-lg w-fit mx-auto">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Manual entry key</Label>
              <div className="flex gap-2">
                <Input value={secret} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={copySecret}>
                  {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="totpToken">Enter the 6-digit code from your app</Label>
              <Input
                id="totpToken"
                type="text"
                placeholder="000000"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="font-mono text-lg tracking-widest"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={verifyToken} disabled={loading || token.length !== 6}>
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
              <Button variant="ghost" onClick={() => setStep('idle')}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === 'recovery' && (
          <div className="space-y-6 max-w-md">
            <div className="rounded-lg border border-orange-500/50 bg-orange-500/10 p-4">
              <p className="text-sm font-medium text-orange-500">
                Save these recovery codes in a safe place. Each code can only be used once.
              </p>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                {recoveryCodes.map((code, i) => (
                  <div key={i} className="px-2 py-1">{code}</div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={copyRecoveryCodes} className="w-full">
                {copiedCodes ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copiedCodes ? 'Copied!' : 'Copy all codes'}
              </Button>
            </div>

            <Button onClick={finishSetup}>
              I've saved my recovery codes
            </Button>
          </div>
        )}

        {step === 'disable' && (
          <div className="space-y-4 max-w-md">
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">
                Disabling 2FA will make your account less secure. Enter your password to confirm.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disablePassword">Confirm password</Label>
              <Input
                id="disablePassword"
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="destructive" onClick={disable2FA} disabled={loading || !disablePassword}>
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </Button>
              <Button variant="ghost" onClick={() => { setStep('idle'); setDisablePassword(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
