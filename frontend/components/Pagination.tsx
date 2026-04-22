'use client';

import { classNames } from '@/lib/format';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from './Icons';

export default function Pagination({
  page,
  pageSize,
  total,
  hasMore,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: {
  page: number;
  pageSize: number;
  total?: number;
  hasMore?: boolean;
  onPageChange: (p: number) => void;
  onPageSizeChange?: (s: number) => void;
  pageSizeOptions?: number[];
}) {
  const totalPages =
    typeof total === 'number' && total > 0 ? Math.max(1, Math.ceil(total / pageSize)) : undefined;

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to =
    typeof total === 'number'
      ? Math.min(total, page * pageSize)
      : page * pageSize;

  const canPrev = page > 1;
  const canNext =
    typeof totalPages === 'number' ? page < totalPages : Boolean(hasMore);

  const pageBtn = (n: number, label?: string) => (
    <button
      key={n}
      onClick={() => onPageChange(n)}
      disabled={n === page}
      className={classNames(
        'min-w-[34px] h-8 px-2 rounded-md text-sm font-medium transition',
        n === page
          ? 'bg-brand-600 text-white shadow-sm'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
      )}
    >
      {label ?? n}
    </button>
  );

  const renderPages = () => {
    if (!totalPages) return null;
    const pages: (number | string)[] = [];
    const push = (v: number | string) => pages.push(v);
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) push(i);
    } else {
      push(1);
      if (page > 3) push('…');
      for (
        let i = Math.max(2, page - 1);
        i <= Math.min(totalPages - 1, page + 1);
        i++
      )
        push(i);
      if (page < totalPages - 2) push('…');
      push(totalPages);
    }
    return pages.map((p, i) =>
      typeof p === 'number' ? (
        pageBtn(p)
      ) : (
        <span key={`e-${i}`} className="px-1 text-slate-400">
          {p}
        </span>
      )
    );
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
        {typeof total === 'number' ? (
          <span>
            Showing <span className="font-medium text-slate-700 dark:text-slate-200">{from.toLocaleString()}</span>–
            <span className="font-medium text-slate-700 dark:text-slate-200">{to.toLocaleString()}</span> of{' '}
            <span className="font-medium text-slate-700 dark:text-slate-200">{total.toLocaleString()}</span>
          </span>
        ) : (
          <span>
            Page <span className="font-medium text-slate-700 dark:text-slate-200">{page}</span>
          </span>
        )}
        {onPageSizeChange && (
          <span className="flex items-center gap-2">
            <span className="hidden sm:inline">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              {pageSizeOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={!canPrev}
          className="h-8 w-8 grid place-items-center rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
          aria-label="First page"
        >
          <IconChevronsLeft width={16} height={16} />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          className="h-8 w-8 grid place-items-center rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
          aria-label="Previous page"
        >
          <IconChevronLeft width={16} height={16} />
        </button>
        {totalPages ? (
          renderPages()
        ) : (
          <span className="px-2 text-sm text-slate-600 dark:text-slate-300">
            Page <strong>{page}</strong>
          </span>
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          className="h-8 w-8 grid place-items-center rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
          aria-label="Next page"
        >
          <IconChevronRight width={16} height={16} />
        </button>
        {totalPages && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={!canNext}
            className="h-8 w-8 grid place-items-center rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
            aria-label="Last page"
          >
            <IconChevronsRight width={16} height={16} />
          </button>
        )}
      </div>
    </div>
  );
}
