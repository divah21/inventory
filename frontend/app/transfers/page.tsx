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
  IconRefresh,
  IconPlus,
  IconWarehouse,
  IconCalendar,
  IconLayers,
} from '@/components/Icons';

const emptyForm = {
  item_id: '',
  from_warehouse_id: '',
  to_warehouse_id: '',
  quantity: '',
  transaction_date: new Date().toISOString().slice(0, 10),
  reference_no: '',
};

export default function TransfersPage() {
  const [search, setSearch] = useState('');
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
  }).toString();
  const key = `/api/transfers?${qs}`;
  const { data, isLoading } = useSWR(key, fetcher);
  const { data: items } = useSWR('/api/items?pageSize=500', fetcher);
  const { data: warehouses } = useSWR('/api/warehouses?pageSize=500', fetcher);
  const rows = data?.data || [];

  const pageTotal = rows.reduce((s: number, r: any) => s + Number(r.quantity || 0), 0);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiPost('/transfers', {
        ...form,
        item_id: Number(form.item_id),
        from_warehouse_id: Number(form.from_warehouse_id),
        to_warehouse_id: Number(form.to_warehouse_id),
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

  return (
    <>
      <PageHeader
        eyebrow="Transactions"
        title="Stock Transfers"
        subtitle="Move stock between warehouses or containers."
        actions={
          <Button icon={<IconPlus />} onClick={() => { setForm(emptyForm); setError(null); setModalOpen(true); }}>
            New Transfer
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Transfers"
          value={data?.total ?? rows.length}
          accent="indigo"
          hint="All transfer records"
          icon={<IconRefresh />}
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
          label="Warehouses"
          value={warehouses?.data?.length ?? 0}
          accent="violet"
          hint="Available locations"
          icon={<IconWarehouse />}
          loading={!warehouses}
        />
        <KPICard
          label="Last Transfer"
          value={rows[0] ? fmtDate(rows[0].transaction_date) : '—'}
          accent="slate"
          hint="Most recent movement"
          icon={<IconCalendar />}
          loading={isLoading}
        />
      </div>

      <FilterBar
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        placeholder="Search reference, code, or description…"
        onReset={search ? () => setSearch('') : undefined}
      />

      <DataTable
        loading={isLoading}
        columns={[
          { key: 'transaction_date', header: 'Date', render: (r) => fmtDate(r.transaction_date) },
          { key: 'code', header: 'Code', render: (r) => <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{r.item?.code}</span> },
          { key: 'description', header: 'Description', render: (r) => r.item?.description },
          {
            key: 'quantity',
            header: 'Qty',
            render: (r) => <span className="font-mono font-semibold text-indigo-700">{fmtQty(r.quantity)}</span>,
            className: 'text-right',
          },
          {
            key: 'from',
            header: 'From',
            render: (r) => (
              <span className="inline-flex items-center gap-1.5 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                {r.fromWarehouse?.name}
              </span>
            ),
          },
          {
            key: 'to',
            header: 'To',
            render: (r) => (
              <span className="inline-flex items-center gap-1.5 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {r.toWarehouse?.name}
              </span>
            ),
          },
          { key: 'reference_no', header: 'Reference', render: (r) => r.reference_no || '—' },
        ]}
        rows={rows}
        emptyTitle="No transfers"
        emptyDescription="Move stock between warehouses to see transfer records."
        emptyAction={
          <Button icon={<IconPlus />} onClick={() => setModalOpen(true)}>
            New Transfer
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
        title="New Transfer"
        subtitle="Move stock between two warehouses."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={submit} loading={saving}>Transfer stock</Button>
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
          <Field label="From warehouse" required>
            <Select value={form.from_warehouse_id} onChange={(e) => setForm({ ...form, from_warehouse_id: e.target.value })}>
              <option value="">Source…</option>
              {(warehouses?.data || []).map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="To warehouse" required>
            <Select value={form.to_warehouse_id} onChange={(e) => setForm({ ...form, to_warehouse_id: e.target.value })}>
              <option value="">Destination…</option>
              {(warehouses?.data || []).map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
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
          <Field label="Reference #" className="md:col-span-2">
            <TextInput
              value={form.reference_no}
              onChange={(e) => setForm({ ...form, reference_no: e.target.value })}
              placeholder="Optional transfer reference"
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
