'use client';

import { ChangeEvent, ReactNode } from 'react';
import { IconFilter, IconSearch, IconX } from './Icons';

export default function FilterBar({
  search,
  onSearch,
  placeholder = 'Search…',
  children,
  right,
  onReset,
}: {
  search?: string;
  onSearch?: (v: string) => void;
  placeholder?: string;
  children?: ReactNode;
  right?: ReactNode;
  onReset?: () => void;
}) {
  return (
    <div className="card p-3 md:p-4 mb-5 flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide pr-1">
        <IconFilter width={14} height={14} />
        Filters
      </div>
      {onSearch !== undefined && (
        <div className="relative flex-1 md:max-w-xs">
          <IconSearch
            width={16}
            height={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
          />
          <input
            value={search ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 flex-1">{children}</div>
      <div className="flex items-center gap-2 ml-auto">
        {onReset && (
          <button
            onClick={onReset}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded-md inline-flex items-center gap-1"
          >
            <IconX width={12} height={12} />
            Clear
          </button>
        )}
        {right}
      </div>
    </div>
  );
}
