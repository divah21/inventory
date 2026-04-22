'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { IconSpinner } from '@/components/Icons';

/**
 * Public routes skip the chrome and the auth requirement.
 * Everything else waits for the auth check, then renders the app shell or
 * redirects to /login.
 */
const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password'];

export default function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (isPublic) return;
    if (status === 'anonymous') {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
    }
  }, [status, isPublic, pathname, router]);

  if (isPublic) return <>{children}</>;

  if (status === 'loading' || status === 'anonymous') {
    return (
      <div className="min-h-screen grid place-items-center text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 text-sm">
          <IconSpinner width={18} height={18} />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 page-scroll">
          <div className="max-w-[1400px] mx-auto px-6 md:px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
