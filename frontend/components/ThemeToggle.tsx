'use client';

import { useTheme, Theme } from '@/lib/theme';
import { IconMoon, IconMonitor, IconSun } from './Icons';
import { classNames } from '@/lib/format';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const opts: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <IconSun width={14} height={14} /> },
    { value: 'system', label: 'System', icon: <IconMonitor width={14} height={14} /> },
    { value: 'dark', label: 'Dark', icon: <IconMoon width={14} height={14} /> },
  ];

  return (
    <div className="inline-flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
      {opts.map((o) => {
        const active = theme === o.value;
        return (
          <button
            key={o.value}
            onClick={() => setTheme(o.value)}
            title={o.label}
            aria-label={`Switch to ${o.label} theme`}
            className={classNames(
              'h-7 w-7 grid place-items-center rounded-md transition',
              active
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            )}
          >
            {o.icon}
          </button>
        );
      })}
    </div>
  );
}
