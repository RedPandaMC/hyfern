import { Suspense } from 'react';
import { getServerSession } from 'next/auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { BackupsContent } from './backups-content';

export const metadata = {
  title: 'Backups - HyFern',
  description: 'Manage server backups',
};

export default async function BackupsPage() {
  const session = await getServerSession(authOptions);

  // Redirect if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Check if user has ADMIN role or higher
  if (!hasPermission(session.user.role, 'ADMIN')) {
    redirect('/dashboard');
  }

  return (
    <DashboardShell
      title="Backups"
      description="Create and restore server backups"
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
          </div>
        }
      >
        <BackupsContent />
      </Suspense>
    </DashboardShell>
  );
}
