import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { Role } from '@/app/generated/prisma';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { JVMSettingsContent } from './jvm-settings-content';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function JVMSettingsPage() {
  // Check authentication and permissions - OWNER only
  const session = await auth();

  if (!session) {
    redirect('/');
  }

  if (!hasPermission(session.user.role, Role.OWNER)) {
    redirect('/dashboard');
  }

  return (
    <DashboardShell pageTitle="JVM Configuration">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">JVM Configuration</h2>
          <p className="text-muted-foreground">
            Fine-tune Java Virtual Machine settings for optimal performance
          </p>
        </div>

        <Suspense fallback={<LoadingState />}>
          <JVMSettingsContent />
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
          <div className="text-muted-foreground">Loading JVM configuration...</div>
        </div>
      </CardContent>
    </Card>
  );
}
