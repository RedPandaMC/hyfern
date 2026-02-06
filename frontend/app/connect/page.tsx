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

  // Redirect if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Check if user has VIEWER role or higher (everyone)
  if (!hasPermission(session.user.role, 'VIEWER')) {
    redirect('/dashboard');
  }

  return (
    <DashboardShell pageTitle="Connection Info">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
          </div>
        }
      >
        <ConnectContent />
      </Suspense>
    </DashboardShell>
  );
}
