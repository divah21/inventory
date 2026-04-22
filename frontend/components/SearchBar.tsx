'use client';

import { ChangeEvent, ReactNode } from 'react';
import { IconSearch } from './Icons';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  right,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="relative flex-1 max-w-md">
        <IconSearch
          width={16}
          height={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
        />
        <input
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
      {right}
    </div>
  );
}
