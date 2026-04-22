'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/FormField';
import { IconAlert, IconInbox, IconSpinner } from '@/components/Icons';
import { useAuth } from '@/lib/auth';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      const next = search?.get('next') || '/';
      router.replace(next);
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
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
      <Field label="Password" required>
        <TextInput
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </Field>
      <div className="text-right -mt-2">
        <Link
          href="/forgot-password"
          className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      {error && (
        <div className="text-sm text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2 flex items-start gap-2">
          <IconAlert width={16} height={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      <Button type="submit" loading={loading} className="w-full justify-center" size="lg">
        Sign in
      </Button>
    </form>
  );
}

function LoginFallback() {
  return (
    <div className="card p-6 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm gap-2">
      <IconSpinner width={18} height={18} />
      Loading…
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid place-items-center px-4 bg-gradient-to-br from-slate-50 via-white to-brand-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white shadow-lg shadow-brand-500/30 mb-4">
            <IconInbox width={24} height={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sign in to the Interplumb Inventory system
          </p>
        </div>

        <Suspense fallback={<LoginFallback />}>
          <LoginForm />
        </Suspense>

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
          Need an account? Contact your administrator.
        </div>
      </div>
    </div>
  );
}
