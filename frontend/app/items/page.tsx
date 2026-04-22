'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FilterBar from '@/components/FilterBar';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import KPICard from '@/components/KPICard';
import { Field, TextInput } from '@/components/FormField';
import {
  IconBox,
  IconEdit,
  IconPlus,
  IconTrash,
  IconAlert,
  IconLayers,
} from '@/components/Icons';
import { apiDelete, apiPost, apiPut, fetcher } from '@/lib/api';
import { fmtQty } from '@/lib/format';

type Item = {
  id?: number;
  code: string;
  description: string;
  unit: string;
  category?: string;
  reorder_level?: number;
  unit_price?: number;
  currency?: string;
};

const empty: Item = { code: '', description: '', unit: 'pcs', reorder_level: 0 };

export default function ItemsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState<Item>(empty);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const key = `/api/items?search=${encodeURIComponent(search)}&page=${page}&pageSize=${pageSize}`;
  const { data, isLoading } = useSWR(key, fetcher);
  const { data: allItems } = useSWR('/api/items?pageSize=10000', fetcher);
  const rows: Item[] = data?.data || [];
  const total: number | undefined = data?.total;

  const allRows: Item[] = allItems?.data || [];
  const lowStock = allRows.filter((r) => (r.reorder_level ?? 0) > 0).length;
  const categories = new Set(allRows.map((r) => r.category).filter(Boolean)).size;

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (row: Item) => {
    setEditing(row);
    setForm({ ...row });
    setError(null);
    setModalOpen(true);
  };

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const payload = {
        ...form,
        reorder_level: Number(form.reorder_level || 0),
        unit_price: form.unit_price ? Number(form.unit_price) : undefined,
      };
      if (editing?.id) await apiPut(`/items/${editing.id}`, payload);
      else await apiPost('/items', payload);
      mutate(key);
      setModalOpen(false);
      setForm(empty);
      setEditing(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Item) => {
    if (!row.id) return;
    if (!confirm(`Delete item "${row.code}"?`)) return;
    try {
      await apiDelete(`/items/${row.id}`);
      mutate(key);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Items"
        subtitle="Inventory master list — item codes, descriptions, and reorder levels"
        actions={
          <Button icon={<IconPlus />} onClick={openNew}>
            New Item
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Total Items"
          value={allRows.length}
          accent="blue"
          hint="All SKUs in catalog"
          icon={<IconBox />}
          loading={!allItems}
        />
        <KPICard
          label="Tracked Reorder"
          value={lowStock}
          accent="amber"
          hint="Items with reorder level set"
          icon={<IconAlert />}
          loading={!allItems}
        />
        <KPICard
          label="Categories"
          value={categories}
          accent="violet"
          hint="Distinct item categories"
          icon={<IconLayers />}
          loading={!allItems}
        />
        <KPICard
          label="Page Size"
          value={pageSize}
          accent="slate"
          hint="Rows visible per page"
          icon={<IconLayers />}
        />
      </div>

      <FilterBar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search code, description or category…"
        onReset={search ? () => setSearch('') : undefined}
      />

      <DataTable
        loading={isLoading}
        columns={[
          {
            key: 'code',
            header: 'Code',
            render: (r) => (
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{r.code}</span>
            ),
          },
          { key: 'description', header: 'Description' },
          { key: 'unit', header: 'Unit' },
          {
            key: 'category',
            header: 'Category',
            render: (r) =>
              r.category ? (
                <span className="badge bg-slate-100 text-slate-700">{r.category}</span>
              ) : (
                <span className="text-slate-400">—</span>
              ),
          },
          {
            key: 'reorder_level',
            header: 'Reorder',
            render: (r) => fmtQty(r.reorder_level),
            className: 'text-right',
          },
          {
            key: 'unit_price',
            header: 'Price',
            render: (r) =>
              r.unit_price ? (
                <span className="font-mono">
                  {r.currency ?? ''} {fmtQty(r.unit_price)}
                </span>
              ) : (
                <span className="text-slate-400">—</span>
              ),
            className: 'text-right',
          },
        ]}
        rows={rows}
        emptyTitle="No items yet"
        emptyDescription="Add your first item to start tracking inventory."
        emptyAction={
          <Button icon={<IconPlus />} onClick={openNew}>
            Add first item
          </Button>
        }
        actions={[
          { label: 'Edit', icon: <IconEdit width={16} height={16} />, onClick: openEdit },
          {
            label: 'Delete',
            icon: <IconTrash width={16} height={16} />,
            variant: 'danger',
            onClick: remove,
          },
        ]}
        pagination={{
          page,
          pageSize,
          total,
          hasMore: rows.length === pageSize,
          onPageChange: setPage,
          onPageSizeChange: (s) => {
            setPageSize(s);
            setPage(1);
          },
        }}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit item' : 'New item'}
        subtitle={
          editing
            ? 'Update the item details and save your changes.'
            : 'Create a new SKU in the inventory catalog.'
        }
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {editing ? 'Save changes' : 'Create item'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Code" required>
            <TextInput
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. 50mm-anchor"
            />
          </Field>
          <Field label="Unit" required>
            <TextInput
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="pcs, kg, m…"
            />
          </Field>
          <Field label="Description" required className="md:col-span-2">
            <TextInput
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description of the item"
            />
          </Field>
          <Field label="Category">
            <TextInput
              value={form.category ?? ''}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Optional"
            />
          </Field>
          <Field label="Reorder level" hint="Trigger low-stock alerts below this qty">
            <TextInput
              type="number"
              value={form.reorder_level ?? 0}
              onChange={(e) =>
                setForm({ ...form, reorder_level: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Unit price">
            <TextInput
              type="number"
              step="0.01"
              value={form.unit_price ?? ''}
              onChange={(e) =>
                setForm({ ...form, unit_price: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Currency">
            <TextInput
              value={form.currency ?? ''}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              placeholder="USD, UGX…"
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
