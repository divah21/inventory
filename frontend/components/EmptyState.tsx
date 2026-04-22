import { ReactNode } from 'react';
import { IconInbox } from './Icons';

export default function EmptyState({
  title = 'No records yet',
  description,
  icon,
  action,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-12 px-6">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700 grid place-items-center text-slate-400 dark:text-slate-500 mb-4">
        {icon ?? <IconInbox width={22} height={22} />}
      </div>
      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</div>
      {description && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          {description}
        </div>
      )}
      {action && <div className="mt-4 inline-flex">{action}</div>}
    </div>
  );
}
