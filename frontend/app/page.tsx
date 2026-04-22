'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import KPICard from '@/components/KPICard';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { fmtQty } from '@/lib/format';
import {
  IconAlert,
  IconArrowDown,
  IconArrowUp,
  IconPackage,
  IconTrending,
} from '@/components/Icons';

export default function DashboardPage() {
  const { data, isLoading } = useSWR('/api/stock/dashboard', fetcher);
  const { data: trends, isLoading: trendsLoading } = useSWR(
    '/api/reports/trends',
    fetcher
  );

  const maxIssued = Math.max(
    1,
    ...(trends?.issued || []).map((t: any) => Number(t.quantity) || 0)
  );
  const maxReceived = Math.max(
    1,
    ...(trends?.received || []).map((t: any) => Number(t.quantity) || 0)
  );

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        subtitle="Stock movement and inventory health across all projects and warehouses"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <KPICard
          label="Opening Stock"
          value={data?.opening_total ?? 0}
          accent="slate"
          hint="Sum of all opening quantities"
          icon={<IconPackage />}
          loading={isLoading}
        />
        <KPICard
          label="Stock Received"
          value={data?.received_total ?? 0}
          accent="blue"
          hint="Total received to date"
          icon={<IconArrowDown />}
          loading={isLoading}
        />
        <KPICard
          label="Stock Issued"
          value={data?.issued_total ?? 0}
          accent="amber"
          hint="Total issued across projects"
          icon={<IconArrowUp />}
          loading={isLoading}
        />
        <KPICard
          label="On Hand"
          value={data?.on_hand_total ?? 0}
          accent="green"
          hint={`${data?.low_stock_count ?? 0} items below reorder level`}
          icon={<IconTrending />}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Most Issued Items</h2>
              <p className="text-xs text-slate-500">Top movers across all projects</p>
            </div>
          </div>
          <DataTable
            loading={isLoading}
            columns={[
              { key: 'code', header: 'Code', width: '30%' },
              { key: 'description', header: 'Description' },
              {
                key: 'total_issued',
                header: 'Total Issued',
                render: (r) => (
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {fmtQty(r.total_issued)}
                  </span>
                ),
                className: 'text-right',
              },
            ]}
            rows={data?.most_issued || []}
            emptyTitle="No issuance yet"
            emptyDescription="Issued material will appear here once recorded."
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Low Stock Alerts</h2>
              <p className="text-xs text-slate-500">Items at or below reorder level</p>
            </div>
            {(data?.low_stock_count ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-full px-2.5 py-1">
                <IconAlert width={12} height={12} />
                {data?.low_stock_count} alerts
              </span>
            )}
          </div>
          <DataTable
            loading={isLoading}
            columns={[
              { key: 'item_code', header: 'Code' },
              { key: 'description', header: 'Description' },
              { key: 'warehouse', header: 'Warehouse' },
              {
                key: 'on_hand',
                header: 'On Hand',
                render: (r) => (
                  <span className="badge bg-rose-100 text-rose-700">
                    {fmtQty(r.on_hand)}
                  </span>
                ),
                className: 'text-right',
              },
              {
                key: 'reorder_level',
                header: 'Reorder',
                render: (r) => fmtQty(r.reorder_level),
                className: 'text-right',
              },
            ]}
            rows={data?.low_stock_items || []}
            emptyTitle="All items healthy"
            emptyDescription="No items are below their reorder level."
          />
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Monthly Movement Trend</h2>
            <p className="text-xs text-slate-500">Issued vs. received per month</p>
          </div>
        </div>
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TrendColumn
              title="Issued"
              color="amber"
              max={maxIssued}
              loading={trendsLoading}
              rows={trends?.issued || []}
            />
            <TrendColumn
              title="Received"
              color="blue"
              max={maxReceived}
              loading={trendsLoading}
              rows={trends?.received || []}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function TrendColumn({
  title,
  color,
  max,
  rows,
  loading,
}: {
  title: string;
  color: 'amber' | 'blue';
  max: number;
  rows: { month: string; quantity: number }[];
  loading?: boolean;
}) {
  const bar =
    color === 'amber'
      ? 'bg-gradient-to-r from-amber-400 to-amber-500'
      : 'bg-gradient-to-r from-brand-500 to-brand-600';
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {title}
        </div>
        <div className="text-xs text-slate-400">Qty</div>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-7 rounded-md animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%]"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-xs text-slate-400 py-6 text-center">No data yet</div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((t) => {
            const pct = Math.max(4, (Number(t.quantity) / max) * 100);
            return (
              <div key={t.month} className="flex items-center gap-3 text-sm">
                <div className="w-16 text-xs text-slate-500 tabular-nums">{t.month}</div>
                <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
                  <div
                    className={`h-full ${bar} rounded-md transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-20 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                  {fmtQty(t.quantity)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
