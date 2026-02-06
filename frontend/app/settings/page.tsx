import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { Role } from '@/app/generated/prisma';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SettingsContent } from './settings-content';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  // Check authentication and permissions
  const session = await auth();

  if (!session) {
    redirect('/');
  }

  if (!hasPermission(session.user.role, Role.ADMIN)) {
    redirect('/dashboard');
  }

  return (
    <DashboardShell pageTitle="Server Settings">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Server Settings</h2>
          <p className="text-muted-foreground">
            Configure your server's core settings and behavior
          </p>
        </div>

        <Suspense fallback={<LoadingState />}>
          <SettingsContent />
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
          <div className="text-muted-foreground">Loading configuration...</div>
        </div>
      </CardContent>
    </Card>
  );
}
