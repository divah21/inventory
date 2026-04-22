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
  IconArrowDown,
  IconPlus,
  IconTruck,
  IconCalendar,
  IconLayers,
} from '@/components/Icons';

const emptyForm = {
  item_id: '',
  warehouse_id: '',
  supplier_id: '',
  quantity: '',
  invoice_no: '',
  transaction_date: new Date().toISOString().slice(0, 10),
};

export default function ReceiptsPage() {
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [supplierId, setSupplierId] = useState('');
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
    ...(warehouseId ? { warehouseId } : {}),
    ...(supplierId ? { supplierId } : {}),
  }).toString();
  const key = `/api/receipts?${qs}`;
  const { data, isLoading } = useSWR(key, fetcher);
  const { data: items } = useSWR('/api/items?pageSize=500', fetcher);
  const { data: warehouses } = useSWR('/api/warehouses?pageSize=500', fetcher);
  const { data: suppliers } = useSWR('/api/suppliers?pageSize=500', fetcher);
  const rows = data?.data || [];

  const pageTotal = rows.reduce((s: number, r: any) => s + Number(r.quantity || 0), 0);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiPost('/receipts', {
        ...form,
        item_id: Number(form.item_id),
        warehouse_id: Number(form.warehouse_id),
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
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

  const filtersActive = Boolean(search || warehouseId || supplierId);

  return (
    <>
      <PageHeader
        eyebrow="Transactions"
        title="Stock Received"
        subtitle="Purchases and deliveries into warehouses."
        actions={
          <Button icon={<IconPlus />} onClick={() => { setForm(emptyForm); setError(null); setModalOpen(true); }}>
            Record Receipt
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Total Receipts"
          value={data?.total ?? rows.length}
          accent="blue"
          hint="All receipt records"
          icon={<IconArrowDown />}
          loading={isLoading}
        />
        <KPICard
          label="Page Qty"
          value={pageTotal}
          accent="green"
          hint="Sum of current page"
          icon={<IconLayers />}
          loading={isLoading}
        />
        <KPICard
          label="Suppliers"
          value={suppliers?.data?.length ?? 0}
          accent="violet"
          hint="Active vendor list"
          icon={<IconTruck />}
          loading={!suppliers}
        />
        <KPICard
          label="Last Received"
          value={rows[0] ? fmtDate(rows[0].transaction_date) : '—'}
          accent="slate"
          hint="Most recent delivery"
          icon={<IconCalendar />}
          loading={isLoading}
        />
      </div>

      <FilterBar
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        placeholder="Search invoice, code, or description…"
        onReset={filtersActive ? () => { setSearch(''); setWarehouseId(''); setSupplierId(''); setPage(1); } : undefined}
      >
        <Select value={warehouseId} onChange={(e) => { setWarehouseId(e.target.value); setPage(1); }} className="max-w-xs">
          <option value="">All warehouses</option>
          {(warehouses?.data || []).map((w: any) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </Select>
        <Select value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setPage(1); }} className="max-w-xs">
          <option value="">All suppliers</option>
          {(suppliers?.data || []).map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
      </FilterBar>

      <DataTable
        loading={isLoading}
        columns={[
          { key: 'transaction_date', header: 'Date', render: (r) => fmtDate(r.transaction_date) },
          { key: 'supplier', header: 'Supplier', render: (r) => r.supplier?.name || '—' },
          { key: 'invoice_no', header: 'Invoice', render: (r) => r.invoice_no || '—' },
          { key: 'code', header: 'Code', render: (r) => <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{r.item?.code}</span> },
          { key: 'description', header: 'Description', render: (r) => r.item?.description },
          {
            key: 'quantity',
            header: 'Qty',
            render: (r) => <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">+{fmtQty(r.quantity)}</span>,
            className: 'text-right',
          },
          { key: 'unit', header: 'Unit', render: (r) => r.item?.unit || '—' },
          { key: 'warehouse', header: 'Warehouse', render: (r) => r.warehouse?.name },
        ]}
        rows={rows}
        emptyTitle="No receipts yet"
        emptyDescription="Record stock arrivals to populate this page."
        emptyAction={
          <Button icon={<IconPlus />} onClick={() => setModalOpen(true)}>
            Record Receipt
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
        title="Record Receipt"
        subtitle="Log a delivery of stock into a warehouse."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={submit} loading={saving}>Save receipt</Button>
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
          <Field label="Warehouse" required>
            <Select value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}>
              <option value="">Select warehouse…</option>
              {(warehouses?.data || []).map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Supplier">
            <Select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
              <option value="">— Optional —</option>
              {(suppliers?.data || []).map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
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
          <Field label="Invoice #">
            <TextInput
              value={form.invoice_no}
              onChange={(e) => setForm({ ...form, invoice_no: e.target.value })}
              placeholder="Optional"
            />
          </Field>
          <Field label="Transaction date" required className="md:col-span-2">
            <TextInput
              type="date"
              value={form.transaction_date}
              onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
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
