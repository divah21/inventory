import { classNames } from '@/lib/format';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={classNames(
        'animate-pulse rounded-md bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%]',
        className
      )}
    />
  );
}

export function TableSkeleton({
  rows = 6,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-3 ${i === 0 ? 'w-20' : i === cols - 1 ? 'w-16 ml-auto' : 'flex-1'}`}
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={`h-3.5 ${c === 0 ? 'w-24' : c === cols - 1 ? 'w-12 ml-auto' : 'flex-1'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="card p-5">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-28 mt-3" />
      <Skeleton className="h-3 w-32 mt-2" />
    </div>
  );
}
