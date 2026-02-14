import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ConnectContent } from './connect-content';

export const metadata = {
  title: 'Connection Info - HyFern',
  description: 'Server connection information',
};

export default async function ConnectPage() {
  const session = await auth();

  // Allow both authenticated and unauthenticated access
  // Authenticated users will bypass password gate, others see password form

  return (
    <DashboardShell pageTitle="Connection Info">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        <ConnectContent initialSession={session} />
      </Suspense>
    </DashboardShell>
  );
}
