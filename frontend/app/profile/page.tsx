import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ProfileContent } from './profile-content';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <DashboardShell pageTitle="Profile">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
          <p className="text-muted-foreground">
            Manage your account settings and security
          </p>
        </div>

        <Suspense fallback={<LoadingState />}>
          <ProfileContent />
        </Suspense>
      </div>
    </DashboardShell>
  );
}

function LoadingState() {
  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex items-center justify-center">
          <div className="text-muted-foreground">Loading profile...</div>
        </div>
      </CardContent>
    </Card>
  );
}
