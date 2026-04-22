'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/FormField';
import { IconAlert, IconCheck, IconInbox, IconSpinner } from '@/components/Icons';

function ResetForm() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search?.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="card p-6 bg-white dark:bg-slate-900 shadow-xl">
        <div className="text-sm text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2 flex items-start gap-2">
          <IconAlert width={16} height={16} className="flex-shrink-0 mt-0.5" />
          This reset link is missing its token. Request a new one from the
          &ldquo;Forgot password&rdquo; page.
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Reset failed (${res.status})`);
      setDone(true);
      setTimeout(() => router.replace('/login'), 2000);
    } catch (err: any) {
      setError(err?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="card p-6 bg-white dark:bg-slate-900 shadow-xl space-y-3">
        <div className="flex items-start gap-3 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg px-3 py-2">
          <IconCheck width={16} height={16} className="flex-shrink-0 mt-0.5" />
          Password updated. Redirecting to sign in…
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="card p-6 space-y-4 bg-white dark:bg-slate-900 shadow-xl"
    >
      <Field label="New password" required hint="At least 8 characters.">
        <TextInput
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoFocus
        />
      </Field>
      <Field label="Confirm new password" required>
        <TextInput
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
        />
      </Field>
      {error && (
        <div className="text-sm text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2 flex items-start gap-2">
          <IconAlert width={16} height={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      <Button type="submit" loading={loading} className="w-full justify-center" size="lg">
        Set new password
      </Button>
    </form>
  );
}

function Fallback() {
  return (
    <div className="card p-6 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm gap-2">
      <IconSpinner width={18} height={18} />
      Loading…
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen grid place-items-center px-4 bg-gradient-to-br from-slate-50 via-white to-brand-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white shadow-lg shadow-brand-500/30 mb-4">
            <IconInbox width={24} height={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Choose a new password
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pick something only you know.
          </p>
        </div>

        <Suspense fallback={<Fallback />}>
          <ResetForm />
        </Suspense>

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
          <Link
            href="/login"
            className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
