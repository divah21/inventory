'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/FormField';
import { IconAlert, IconCheck, IconInbox } from '@/components/Icons';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`);
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-gradient-to-br from-slate-50 via-white to-brand-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white shadow-lg shadow-brand-500/30 mb-4">
            <IconInbox width={24} height={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Reset your password
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="card p-6 bg-white dark:bg-slate-900 shadow-xl space-y-3">
            <div className="flex items-start gap-3 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg px-3 py-2">
              <IconCheck width={16} height={16} className="flex-shrink-0 mt-0.5" />
              <div>
                If an account exists for <strong>{email}</strong>, a reset link
                has been issued. Check your inbox (or ask your administrator
                for the link if email isn&apos;t configured yet).
              </div>
            </div>
            <Link
              href="/login"
              className="block text-center text-sm text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="card p-6 space-y-4 bg-white dark:bg-slate-900 shadow-xl"
          >
            <Field label="Email" required>
              <TextInput
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
              />
            </Field>
            {error && (
              <div className="text-sm text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2 flex items-start gap-2">
                <IconAlert width={16} height={16} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            <Button type="submit" loading={loading} className="w-full justify-center" size="lg">
              Send reset link
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
          Remembered it?{' '}
          <Link
            href="/login"
            className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
