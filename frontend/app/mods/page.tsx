import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ModsContent } from './mods-content';

export const metadata = {
  title: 'Mod Manager - HyFern',
  description: 'Browse and install Hytale mods from CurseForge',
};

export default async function ModsPage() {
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
    <DashboardShell pageTitle="Mod Manager">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
          </div>
        }
      >
        <ModsContent />
      </Suspense>
    </DashboardShell>
  );
}
