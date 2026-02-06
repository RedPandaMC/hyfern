import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { FilesContent } from './files-content';

export const metadata = {
  title: 'File Manager - HyFern',
  description: 'Browse and manage server files',
};

export default async function FilesPage() {
  const session = await auth();

  // Redirect if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Check if user has ADMIN role or higher
  if (!hasPermission(session.user.role, 'ADMIN')) {
    redirect('/dashboard');
  }

  return (
    <DashboardShell pageTitle="File Manager">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
          </div>
        }
      >
        <FilesContent />
      </Suspense>
    </DashboardShell>
  );
}
