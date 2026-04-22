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
import { fmtDate, fmtQty } from '@/lib/format';
import {
  IconCalendar,
  IconArrowUp,
  IconFolder,
  IconLayers,
} from '@/components/Icons';

export default function WeeklyReportPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [projectId, setProjectId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');

  const { data: projects } = useSWR('/api/projects?pageSize=500', fetcher);
  const { data: warehouses } = useSWR('/api/warehouses?pageSize=500', fetcher);
  const params = new URLSearchParams(
    Object.entries({ from, to, projectId, warehouseId }).filter(
      ([, v]) => v
    ) as any
  ).toString();
  const { data, isLoading } = useSWR(`/api/reports/weekly?${params}`, fetcher);
  const weeks = data?.data || [];

  const grandTotal = weeks.reduce(
    (s: number, w: any) => s + Number(w.total_issued_all_projects || 0),
    0
  );
  const uniqueProjects = new Set<string>();
  weeks.forEach((w: any) =>
    w.projects?.forEach((p: any) => uniqueProjects.add(p.project_id))
  );

  const filtersActive = Boolean(from || to || projectId || warehouseId);

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Weekly Inventory Summary"
        subtitle="Items issued grouped by week, project, and warehouse."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Weeks"
          value={weeks.length}
          accent="blue"
          hint="Weeks with activity"
          icon={<IconCalendar />}
          loading={isLoading}
        />
        <KPICard
          label="Total Issued"
          value={grandTotal}
          accent="amber"
          hint="Across selected period"
          icon={<IconArrowUp />}
          loading={isLoading}
        />
        <KPICard
          label="Projects"
          value={uniqueProjects.size}
          accent="violet"
          hint="Active in this range"
          icon={<IconFolder />}
          loading={isLoading}
        />
        <KPICard
          label="Avg / Week"
          value={weeks.length > 0 ? Math.round(grandTotal / weeks.length) : 0}
          accent="green"
          hint="Mean issuance volume"
          icon={<IconLayers />}
          loading={isLoading}
        />
      </div>

      <FilterBar
        onReset={
          filtersActive
            ? () => {
                setFrom('');
                setTo('');
                setProjectId('');
                setWarehouseId('');
              }
            : undefined
        }
      >
        <TextInput
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="From"
          className="max-w-[160px]"
        />
        <span className="text-slate-400 text-xs">to</span>
        <TextInput
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="max-w-[160px]"
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
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : weeks.length === 0 ? (
          <div className="card">
            <EmptyState
              title="No issuances in this range"
              description="Try widening the date range or clearing filters."
              icon={<IconCalendar width={22} height={22} />}
            />
          </div>
        ) : (
          weeks.map((week: any) => (
            <div key={week.week_ending} className="card p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Week ending
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {fmtDate(week.week_ending)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Total across projects
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {fmtQty(week.total_issued_all_projects)}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {week.projects.map((p: any) => (
                  <div
                    key={p.project_id}
                    className="border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <div className="flex justify-between px-4 py-2.5 bg-slate-50/60 dark:bg-slate-900/40 font-semibold text-slate-900 dark:text-slate-100">
                      <span className="inline-flex items-center gap-2">
                        <IconFolder width={14} height={14} className="text-violet-500" />
                        {p.project_name}
                      </span>
                      <span className="text-sm text-slate-600">
                        Total: <span className="font-mono text-slate-900 dark:text-slate-100">{fmtQty(p.total_quantity)}</span>
                      </span>
                    </div>
                    <table className="table w-full">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Description</th>
                          <th>Warehouse</th>
                          <th className="text-right">Qty</th>
                          <th>Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.items.map((it: any, idx: number) => (
                          <tr key={idx}>
                            <td className="font-mono font-medium text-slate-900 dark:text-slate-100">{it.item_code}</td>
                            <td>{it.description}</td>
                            <td>{it.warehouse}</td>
                            <td className="text-right font-mono font-semibold">{fmtQty(it.quantity)}</td>
                            <td>{it.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
