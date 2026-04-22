'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FilterBar from '@/components/FilterBar';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import KPICard from '@/components/KPICard';
import { Field, Select, TextInput } from '@/components/FormField';
import { apiPost, fetcher } from '@/lib/api';
import { fmtDate, fmtQty } from '@/lib/format';
import {
  IconArrowUp,
  IconPlus,
  IconFolder,
  IconCalendar,
  IconLayers,
} from '@/components/Icons';

const emptyForm = {
  item_id: '',
  warehouse_id: '',
  project_id: '',
  quantity: '',
  transaction_date: new Date().toISOString().slice(0, 10),
  issued_to: '',
};

export default function IssuedPage() {
  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qs = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(search ? { search } : {}),
    ...(projectId ? { projectId } : {}),
    ...(warehouseId ? { warehouseId } : {}),
  }).toString();
  const key = `/api/issued?${qs}`;
  const { data, isLoading } = useSWR(key, fetcher);
  const { data: items } = useSWR('/api/items?pageSize=500', fetcher);
  const { data: warehouses } = useSWR('/api/warehouses?pageSize=500', fetcher);
  const { data: projects } = useSWR('/api/projects?pageSize=200', fetcher);
  const rows = data?.data || [];

  const pageTotal = rows.reduce((s: number, r: any) => s + Number(r.quantity || 0), 0);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiPost('/issued', {
        ...form,
        item_id: Number(form.item_id),
        warehouse_id: Number(form.warehouse_id),
        project_id: Number(form.project_id),
        quantity: Number(form.quantity),
      });
      mutate(key);
      setModalOpen(false);
      setForm(emptyForm);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const filtersActive = Boolean(search || projectId || warehouseId);

  return (
    <>
      <PageHeader
        eyebrow="Transactions"
        title="Issued Material"
        subtitle="Record materials issued to projects. Cannot exceed on-hand stock."
        actions={
          <Button icon={<IconPlus />} onClick={() => { setForm(emptyForm); setError(null); setModalOpen(true); }}>
            Issue Material
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Issuance Records"
          value={data?.total ?? rows.length}
          accent="amber"
          hint="All issued lines"
          icon={<IconArrowUp />}
          loading={isLoading}
        />
        <KPICard
          label="Page Qty"
          value={pageTotal}
          accent="blue"
          hint="Sum of current page"
          icon={<IconLayers />}
          loading={isLoading}
        />
        <KPICard
          label="Active Projects"
          value={projects?.data?.length ?? 0}
          accent="violet"
          hint="Destinations for issuance"
          icon={<IconFolder />}
          loading={!projects}
        />
        <KPICard
          label="Last Issued"
          value={rows[0] ? fmtDate(rows[0].transaction_date) : '—'}
          accent="slate"
          hint="Most recent issuance"
          icon={<IconCalendar />}
          loading={isLoading}
        />
      </div>

      <FilterBar
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        placeholder="Search project, code, or description…"
        onReset={filtersActive ? () => { setSearch(''); setProjectId(''); setWarehouseId(''); setPage(1); } : undefined}
      >
        <Select value={projectId} onChange={(e) => { setProjectId(e.target.value); setPage(1); }} className="max-w-xs">
          <option value="">All projects</option>
          {(projects?.data || []).map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.code ? `${p.code} · ${p.name}` : p.name}
            </option>
          ))}
        </Select>
        <Select value={warehouseId} onChange={(e) => { setWarehouseId(e.target.value); setPage(1); }} className="max-w-xs">
          <option value="">All warehouses</option>
          {(warehouses?.data || []).map((w: any) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </Select>
      </FilterBar>

      <DataTable
        loading={isLoading}
        columns={[
          { key: 'transaction_date', header: 'Date', render: (r) => fmtDate(r.transaction_date) },
          { key: 'week_ending', header: 'Week End', render: (r) => fmtDate(r.week_ending) },
          {
            key: 'project',
            header: 'Project',
            render: (r) => {
              if (!r.project?.name && !r.issued_to) return <span className="text-slate-400">—</span>;
              return (
                <div className="flex items-center gap-2 min-w-0">
                  {r.project?.code && (
                    <span className="font-mono text-[10px] font-semibold bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400 px-1.5 py-0.5 rounded">
                      {r.project.code}
                    </span>
                  )}
                  <span className="badge bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400 truncate">
                    {r.project?.name || r.issued_to}
                  </span>
                </div>
              );
            },
          },
          { key: 'code', header: 'Code', render: (r) => <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{r.item?.code}</span> },
          { key: 'description', header: 'Description', render: (r) => r.item?.description },
          {
            key: 'quantity',
            header: 'Qty',
            render: (r) => <span className="font-mono font-semibold text-amber-700">−{fmtQty(r.quantity)}</span>,
            className: 'text-right',
          },
          { key: 'unit', header: 'Unit', render: (r) => r.item?.unit },
          { key: 'warehouse', header: 'Warehouse', render: (r) => r.warehouse?.name },
        ]}
        rows={rows}
        emptyTitle="No issuance records"
        emptyDescription="Issue material to a project to see records here."
        emptyAction={
          <Button icon={<IconPlus />} onClick={() => setModalOpen(true)}>
            Issue Material
          </Button>
        }
        pagination={{
          page,
          pageSize,
          total: data?.total,
          hasMore: rows.length === pageSize,
          onPageChange: setPage,
          onPageSizeChange: (s) => { setPageSize(s); setPage(1); },
        }}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Issue Material"
        subtitle="Log materials going out to a project. Quantity cannot exceed on-hand stock."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={submit} loading={saving}>Issue material</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Item" required className="md:col-span-2">
            <Select value={form.item_id} onChange={(e) => setForm({ ...form, item_id: e.target.value })}>
              <option value="">Select item…</option>
              {(items?.data || []).map((i: any) => (
                <option key={i.id} value={i.id}>{i.code} — {i.description}</option>
              ))}
            </Select>
          </Field>
          <Field label="From Warehouse" required>
            <Select value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}>
              <option value="">Select warehouse…</option>
              {(warehouses?.data || []).map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Project" required>
            <Select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              <option value="">Select project…</option>
              {(projects?.data || []).map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.code ? `${p.code} · ${p.name}` : p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Quantity" required>
            <TextInput
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </Field>
          <Field label="Transaction date" required>
            <TextInput
              type="date"
              value={form.transaction_date}
              onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
            />
          </Field>
          <Field label="Issued to (optional)" className="md:col-span-2">
            <TextInput
              value={form.issued_to}
              onChange={(e) => setForm({ ...form, issued_to: e.target.value })}
              placeholder="Person or team who received it"
            />
          </Field>
        </div>
        {error && (
          <div className="mt-4 text-sm text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </Modal>
    </>
  );
}
