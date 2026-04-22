'use client';

import { ReactNode, useState } from 'react';
import useSWR, { mutate } from 'swr';
import PageHeader from '@/components/PageHeader';
import DataTable, { Column } from '@/components/DataTable';
import FilterBar from '@/components/FilterBar';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { Field, Select, TextInput } from '@/components/FormField';
import { IconEdit, IconPlus, IconTrash } from '@/components/Icons';
import { apiDelete, apiPost, apiPut, fetcher } from '@/lib/api';

type FormFieldSpec = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
};

type Props<T> = {
  title: string;
  subtitle?: string;
  resource: string;
  columns: Column<T>[];
  formFields: FormFieldSpec[];
  stats?: (rows: T[]) => ReactNode;
  eyebrow?: string;
};

export default function SimpleMasterPage<T extends Record<string, any>>(props: Props<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const key = `/api/${props.resource}?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`;
  const { data, isLoading } = useSWR(key, fetcher);
  const rows: T[] = data?.data || [];

  const openNew = () => {
    setEditing(null);
    setForm({});
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({ ...row });
    setError(null);
    setModalOpen(true);
  };

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      if (editing?.id) {
        await apiPut(`/${props.resource}/${editing.id}`, form);
      } else {
        await apiPost(`/${props.resource}`, form);
      }
      mutate(key);
      setModalOpen(false);
      setForm({});
      setEditing(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: any) => {
    if (!row?.id) return;
    if (!confirm(`Delete "${row.name ?? row.code ?? row.id}"?`)) return;
    try {
      await apiDelete(`/${props.resource}/${row.id}`);
      mutate(key);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={props.eyebrow ?? 'Master data'}
        title={props.title}
        subtitle={props.subtitle}
        actions={
          <Button icon={<IconPlus />} onClick={openNew}>
            Add {props.title.replace(/s$/, '')}
          </Button>
        }
      />

      {props.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {props.stats(rows)}
        </div>
      )}

      <FilterBar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder={`Search ${props.title.toLowerCase()}…`}
        onReset={search ? () => setSearch('') : undefined}
      />

      <DataTable
        loading={isLoading}
        columns={props.columns}
        rows={rows}
        emptyTitle={`No ${props.title.toLowerCase()} yet`}
        emptyDescription={`Click "Add ${props.title.replace(/s$/, '')}" to create one.`}
        emptyAction={
          <Button icon={<IconPlus />} onClick={openNew}>
            Add {props.title.replace(/s$/, '')}
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
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${props.title.replace(/s$/, '')}` : `New ${props.title.replace(/s$/, '')}`}
        subtitle={editing ? 'Update the details and save.' : 'Fill in the details below to create a new record.'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {editing ? 'Save changes' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {props.formFields.map((f) => (
            <Field key={f.key} label={f.label} required={f.required}>
              {f.options ? (
                <Select
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                >
                  <option value="">Select…</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <TextInput
                  type={f.type || 'text'}
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              )}
            </Field>
          ))}
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
