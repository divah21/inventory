'use client';

import { ReactNode } from 'react';
import { classNames } from '@/lib/format';
import Pagination from './Pagination';
import { TableSkeleton } from './Skeleton';
import EmptyState from './EmptyState';

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  width?: string;
};

export type RowAction<T> = {
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void;
  variant?: 'default' | 'danger';
  hidden?: (row: T) => boolean;
};

type Pagination = {
  page: number;
  pageSize: number;
  total?: number;
  hasMore?: boolean;
  onPageChange: (p: number) => void;
  onPageSizeChange?: (s: number) => void;
};

export default function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  loading,
  empty,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyIcon,
  emptyAction,
  actions,
  pagination,
  dense,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  empty?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;
  actions?: RowAction<T>[];
  pagination?: Pagination;
  dense?: boolean;
}) {
  const colCount = columns.length + (actions?.length ? 1 : 0);

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={c.width ? { width: c.width } : undefined}
                  className={classNames(
                    'text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-4 py-3',
                    c.className
                  )}
                >
                  {c.header}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="w-24 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-4 py-3">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colCount} className="p-0">
                  <TableSkeleton rows={6} cols={colCount} />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colCount}>
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription ?? empty}
                    icon={emptyIcon}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.id ?? idx}
                  className="border-b border-slate-100 dark:border-slate-800 last:border-b-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={classNames(
                        'px-4 text-sm text-slate-700 dark:text-slate-300',
                        dense ? 'py-2' : 'py-3',
                        c.className
                      )}
                    >
                      {c.render ? c.render(row) : (row as any)[c.key] ?? '—'}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className={classNames('px-4 text-right', dense ? 'py-2' : 'py-3')}>
                      <div className="inline-flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                        {actions.map((a, i) => {
                          if (a.hidden?.(row)) return null;
                          return (
                            <button
                              key={i}
                              onClick={() => a.onClick(row)}
                              title={a.label}
                              className={classNames(
                                'p-1.5 rounded-md transition',
                                a.variant === 'danger'
                                  ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300'
                                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                              )}
                            >
                              {a.icon ?? a.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && !loading && rows.length > 0 && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          hasMore={pagination.hasMore}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
        />
      )}
    </div>
  );
}
