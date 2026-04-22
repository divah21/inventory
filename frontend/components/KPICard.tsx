import { ReactNode } from 'react';
import { fmtQty } from '@/lib/format';
import { Skeleton } from './Skeleton';

type Accent = 'blue' | 'green' | 'red' | 'amber' | 'slate' | 'violet' | 'indigo';

const accents: Record<
  Accent,
  { label: string; bar: string; icon: string; glow: string }
> = {
  blue: {
    label: 'text-brand-700 bg-brand-50 dark:text-brand-400 dark:bg-brand-500/10',
    bar: 'bg-gradient-to-r from-brand-500 to-brand-600',
    icon: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
    glow: 'before:from-brand-500/10',
  },
  green: {
    label: 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10',
    bar: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    glow: 'before:from-emerald-500/10',
  },
  red: {
    label: 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10',
    bar: 'bg-gradient-to-r from-rose-500 to-rose-600',
    icon: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
    glow: 'before:from-rose-500/10',
  },
  amber: {
    label: 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10',
    bar: 'bg-gradient-to-r from-amber-500 to-amber-600',
    icon: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    glow: 'before:from-amber-500/10',
  },
  slate: {
    label: 'text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-700/50',
    bar: 'bg-gradient-to-r from-slate-500 to-slate-600',
    icon: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    glow: 'before:from-slate-500/10',
  },
  violet: {
    label: 'text-violet-700 bg-violet-50 dark:text-violet-400 dark:bg-violet-500/10',
    bar: 'bg-gradient-to-r from-violet-500 to-violet-600',
    icon: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
    glow: 'before:from-violet-500/10',
  },
  indigo: {
    label: 'text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10',
    bar: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
    icon: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
    glow: 'before:from-indigo-500/10',
  },
};

export default function KPICard({
  label,
  value,
  accent = 'slate',
  hint,
  icon,
  trend,
  loading,
}: {
  label: string;
  value: number | string;
  accent?: Accent;
  hint?: string;
  icon?: ReactNode;
  trend?: { value: number; label?: string };
  loading?: boolean;
}) {
  const a = accents[accent];

  return (
    <div
      className={`relative overflow-hidden card p-5 group transition hover:shadow-md hover:-translate-y-0.5 before:absolute before:inset-0 before:bg-gradient-to-br before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition ${a.glow}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 ${a.bar}`} />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <div
            className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${a.label}`}
          >
            {label}
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28 mt-3" />
          ) : (
            <div className="mt-3 text-[28px] leading-none font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {typeof value === 'number' ? fmtQty(value) : value}
            </div>
          )}
          {hint &&
            (loading ? (
              <Skeleton className="h-3 w-32 mt-2.5" />
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 truncate">{hint}</div>
            ))}
          {trend && !loading && (
            <div
              className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${
                trend.value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value)}%
              {trend.label && <span className="text-slate-500 dark:text-slate-400 font-normal">{trend.label}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={`w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 ${a.icon}`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
