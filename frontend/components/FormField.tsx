'use client';

import { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import { classNames } from '@/lib/format';

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={classNames('block', className)}>
      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </div>
      {children}
      {error ? (
        <div className="text-xs text-rose-600 dark:text-rose-400 mt-1">{error}</div>
      ) : hint ? (
        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{hint}</div>
      ) : null}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={classNames(
        'w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-800 transition focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
        props.className
      )}
    />
  );
}

export function Select(
  props: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }
) {
  return (
    <select
      {...props}
      className={classNames(
        'w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 transition focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
        props.className
      )}
    >
      {props.children}
    </select>
  );
}
