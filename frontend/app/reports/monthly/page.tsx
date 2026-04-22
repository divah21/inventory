'use client';

import { useState } from 'react';
import useSWR from 'swr';
import PageHeader from '@/components/PageHeader';
import FilterBar from '@/components/FilterBar';
import KPICard from '@/components/KPICard';
import EmptyState from '@/components/EmptyState';
import { Select, TextInput } from '@/components/FormField';
import { TableSkeleton } from '@/components/Skeleton';
import { fetcher } from '@/lib/api';
import { fmtQty } from '@/lib/format';
import {
  IconCalendar,
  IconArrowDown,
  IconArrowUp,
  IconTrending,
  IconFolder,
} from '@/components/Icons';

export default function MonthlyReportPage() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [projectId, setProjectId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');

  const { data: projects } = useSWR('/api/projects?pageSize=500', fetcher);
  const { data: warehouses } = useSWR('/api/warehouses?pageSize=500', fetcher);
  const params = new URLSearchParams(
    Object.entries({ year, projectId, warehouseId }).filter(([, v]) => v) as any
  ).toString();
  const { data, isLoading } = useSWR(`/api/reports/monthly?${params}`, fetcher);
  const months = data?.data || [];

  const totalIssued = months.reduce(
    (s: number, m: any) => s + Number(m.total_issued_all_projects || 0),
    0
  );
  const totalReceived = months.reduce(
    (s: number, m: any) => s + Number(m.total_received_all_projects || 0),
    0
  );

  const filtersActive = Boolean(projectId || warehouseId);

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Monthly Inventory Summary"
        subtitle="Issued + received per month, per project, with balances."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Months"
          value={months.length}
          accent="blue"
          hint={`For year ${year || '—'}`}
          icon={<IconCalendar />}
          loading={isLoading}
        />
        <KPICard
          label="Total Received"
          value={totalReceived}
          accent="green"
          hint="In this period"
          icon={<IconArrowDown />}
          loading={isLoading}
        />
        <KPICard
          label="Total Issued"
          value={totalIssued}
          accent="amber"
          hint="In this period"
          icon={<IconArrowUp />}
          loading={isLoading}
        />
        <KPICard
          label="Net Movement"
          value={totalReceived - totalIssued}
          accent={totalReceived >= totalIssued ? 'green' : 'red'}
          hint="Received − Issued"
          icon={<IconTrending />}
          loading={isLoading}
        />
      </div>

      <FilterBar
        onReset={
          filtersActive
            ? () => {
                setProjectId('');
                setWarehouseId('');
              }
            : undefined
        }
      >
        <TextInput
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Year"
          className="max-w-[120px]"
        />
        <Select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="max-w-xs"
        >
          <option value="">All projects</option>
          {(projects?.data || []).map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Select
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          className="max-w-xs"
        >
          <option value="">All warehouses</option>
          {(warehouses?.data || []).map((w: any) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
      </FilterBar>

      <div className="space-y-6">
        {isLoading ? (
          <div className="card">
            <TableSkeleton rows={6} cols={4} />
          </div>
        ) : months.length === 0 ? (
          <div className="card">
            <EmptyState
              title="No data in this period"
              description="Try selecting a different year or clearing filters."
              icon={<IconCalendar width={22} height={22} />}
            />
          </div>
        ) : (
          months.map((m: any) => (
            <div key={m.month} className="card p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{m.month}</div>
                <div className="flex gap-6 text-sm">
                  <div className="text-right">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                      Issued
                    </div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {fmtQty(m.total_issued_all_projects)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                      Received
                    </div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {fmtQty(m.total_received_all_projects)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Issued by project
                  </div>
                  {m.projects.map((p: any) => (
                    <div
                      key={p.project_id}
                      className="border border-slate-200 rounded-xl mb-2 overflow-hidden"
                    >
                      <div className="flex justify-between px-3 py-2 bg-slate-50/60 dark:bg-slate-900/40 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        <span className="inline-flex items-center gap-2">
                          <IconFolder width={14} height={14} className="text-violet-500" />
                          {p.project_name}
                        </span>
                        <span className="font-mono">{fmtQty(p.total_issued)}</span>
                      </div>
                      <table className="table w-full">
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Description</th>
                            <th className="text-right">Issued</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.items.map((it: any, idx: number) => (
                            <tr key={idx}>
                              <td className="font-mono font-medium text-slate-900 dark:text-slate-100">{it.item_code}</td>
                              <td>{it.description}</td>
                              <td className="text-right font-mono">{fmtQty(it.issued_quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Received this month
                  </div>
                  <div className="card overflow-hidden">
                    <table className="table w-full">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Description</th>
                          <th className="text-right">Received</th>
                        </tr>
                      </thead>
                      <tbody>
                        {m.received.map((it: any, idx: number) => (
                          <tr key={idx}>
                            <td className="font-mono font-medium text-slate-900 dark:text-slate-100">{it.item_code}</td>
                            <td>{it.description}</td>
                            <td className="text-right font-mono">{fmtQty(it.received_quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
