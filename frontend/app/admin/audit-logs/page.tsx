'use client';

import { useState } from 'react';
import useSWR from 'swr';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FilterBar from '@/components/FilterBar';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import KPICard from '@/components/KPICard';
import { Select, TextInput } from '@/components/FormField';
import { fetcher } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import {
  IconSettings,
  IconUser,
  IconAlert,
  IconCheck,
  IconCalendar,
} from '@/components/Icons';

type Log = {
  id: number;
  created_at: string;
  method: string;
  path: string;
  resource?: string;
  resource_id?: string;
  status_code?: number;
  user_email?: string;
  user_role?: string;
  ip?: string;
  user_agent?: string;
  payload?: any;
  user?: { id: number; email: string; name: string; role: string } | null;
};

const METHOD_COLORS: Record<string, string> = {
  POST: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  PATCH: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  DELETE: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [resource, setResource] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Log | null>(null);

  const qs = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(search ? { search } : {}),
    ...(method ? { method } : {}),
    ...(resource ? { resource } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  }).toString();
  const { data, isLoading } = useSWR(`/api/audit-logs?${qs}`, fetcher);
  const rows: Log[] = data?.data || [];

  const filtersActive = Boolean(search || method || resource || from || to);

  const succeeded = rows.filter((r) => (r.status_code ?? 0) < 400).length;
  const failed = rows.filter((r) => (r.status_code ?? 0) >= 400).length;

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Audit Logs"
        subtitle="Every mutating request to the API is recorded. Click a row to inspect the payload."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Events (page)"
          value={data?.total ?? rows.length}
          accent="blue"
          icon={<IconSettings />}
          hint="Total across filter"
          loading={isLoading}
        />
        <KPICard
          label="Succeeded"
          value={succeeded}
          accent="green"
          icon={<IconCheck />}
          hint="2xx / 3xx responses"
          loading={isLoading}
        />
        <KPICard
          label="Failed"
          value={failed}
          accent="red"
          icon={<IconAlert />}
          hint="4xx / 5xx responses"
          loading={isLoading}
        />
        <KPICard
          label="Newest"
          value={rows[0] ? fmtDate(rows[0].created_at) : '—'}
          accent="slate"
          icon={<IconCalendar />}
          hint="Most recent event"
          loading={isLoading}
        />
      </div>

      <FilterBar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search path, email, resource…"
        onReset={
          filtersActive
            ? () => {
                setSearch('');
                setMethod('');
                setResource('');
                setFrom('');
                setTo('');
                setPage(1);
              }
            : undefined
        }
      >
        <Select
          value={method}
          onChange={(e) => {
            setMethod(e.target.value);
            setPage(1);
          }}
          className="max-w-[140px]"
        >
          <option value="">All methods</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </Select>
        <Select
          value={resource}
          onChange={(e) => {
            setResource(e.target.value);
            setPage(1);
          }}
          className="max-w-[180px]"
        >
          <option value="">All resources</option>
          {['items', 'warehouses', 'suppliers', 'projects', 'opening-stock', 'receipts', 'issued', 'transfers', 'users', 'uploads', 'auth'].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </Select>
        <TextInput
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
          className="max-w-[150px]"
        />
        <span className="text-slate-400 text-xs">to</span>
        <TextInput
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(1);
          }}
          className="max-w-[150px]"
        />
      </FilterBar>

      <DataTable
        loading={isLoading}
        columns={[
          {
            key: 'created_at',
            header: 'When',
            width: '140px',
            render: (r: Log) => (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(r.created_at).toLocaleString()}
              </span>
            ),
          },
          {
            key: 'method',
            header: 'Method',
            width: '90px',
            render: (r: Log) => (
              <span
                className={`badge font-mono ${METHOD_COLORS[r.method] || 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300'}`}
              >
                {r.method}
              </span>
            ),
          },
          {
            key: 'path',
            header: 'Path',
            render: (r: Log) => (
              <span className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate">
                {r.path}
              </span>
            ),
          },
          {
            key: 'user',
            header: 'User',
            render: (r: Log) =>
              r.user_email ? (
                <div className="flex items-center gap-2">
                  <IconUser width={12} height={12} className="text-slate-400" />
                  <div className="text-xs">
                    <div className="text-slate-700 dark:text-slate-200">{r.user_email}</div>
                    <div className="text-slate-400 dark:text-slate-500">{r.user_role}</div>
                  </div>
                </div>
              ) : (
                <span className="text-slate-400">anonymous</span>
              ),
          },
          {
            key: 'status_code',
            header: 'Status',
            width: '80px',
            className: 'text-right',
            render: (r: Log) => {
              const s = r.status_code ?? 0;
              const cls =
                s < 400
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400';
              return <span className={`font-mono font-semibold ${cls}`}>{s || '—'}</span>;
            },
          },
        ]}
        rows={rows}
        emptyTitle="No audit events"
        emptyDescription="Mutations by authenticated users will appear here."
        actions={[
          {
            label: 'View payload',
            icon: <IconSettings width={16} height={16} />,
            onClick: (r) => setSelected(r as Log),
          },
        ]}
        pagination={{
          page,
          pageSize,
          total: data?.total,
          hasMore: rows.length === pageSize,
          onPageChange: setPage,
          onPageSizeChange: (s) => {
            setPageSize(s);
            setPage(1);
          },
        }}
      />

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `#${selected.id} · ${selected.method} ${selected.path}` : 'Event'}
        subtitle={selected ? new Date(selected.created_at).toLocaleString() : undefined}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Close
          </Button>
        }
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-2 gap-4">
              <Info label="User" value={selected.user_email || 'anonymous'} />
              <Info label="Role" value={selected.user_role || '—'} />
              <Info label="Resource" value={selected.resource || '—'} />
              <Info label="Resource ID" value={selected.resource_id || '—'} />
              <Info label="Status" value={String(selected.status_code || '—')} />
              <Info label="IP" value={selected.ip || '—'} />
            </dl>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Payload
              </div>
              <pre className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 overflow-auto max-h-[40vh] text-slate-800 dark:text-slate-200">
                {JSON.stringify(selected.payload, null, 2) || 'null'}
              </pre>
            </div>
            {selected.user_agent && (
              <Info label="User-agent" value={selected.user_agent} />
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="text-sm text-slate-900 dark:text-slate-100 break-all">{value}</dd>
    </div>
  );
}
