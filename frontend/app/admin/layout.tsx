'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { IconAlert } from '@/components/Icons';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();

  // AuthGate has already redirected anonymous users to /login by the time we
  // render, so we only need to guard against authenticated non-admins.
  if (status === 'authenticated' && user?.role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto mt-16">
        <div className="card p-8 text-center bg-white dark:bg-slate-900 shadow-xl">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-500/15 grid place-items-center text-rose-600 dark:text-rose-400 mb-4">
            <IconAlert width={24} height={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Administrator access required
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            You&apos;re signed in as <strong>{user?.email}</strong>, but this
            page is only available to administrators.
          </p>
          <Link
            href="/"
            className="inline-block mt-6 text-sm text-brand-600 dark:text-brand-400 font-semibold hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
