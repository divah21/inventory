'use client';

import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FilterBar from '@/components/FilterBar';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import KPICard from '@/components/KPICard';
import { Field, Select, TextInput } from '@/components/FormField';
import {
  IconAlert,
  IconCheck,
  IconEdit,
  IconFolder,
  IconPlus,
  IconTrash,
} from '@/components/Icons';
import { apiDelete, apiPost, apiPut, fetcher } from '@/lib/api';

type Project = {
  id?: number;
  code?: string;
  name: string;
  client?: string;
  site_location?: string;
  status?: 'active' | 'on_hold' | 'completed' | 'cancelled';
};

const emptyForm: Project = {
  code: '',
  name: '',
  client: '',
  site_location: '',
  status: 'active',
};

const STATUS_LABEL: Record<string, { cls: string; label: string }> = {
  active: { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400', label: 'Active' },
  on_hold: { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400', label: 'On hold' },
  completed: { cls: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300', label: 'Completed' },
  cancelled: { cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400', label: 'Cancelled' },
};

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function suggestCode(name: string, client?: string): string {
  const base = (client || name || '').trim();
  if (!base) return '';
  const initials = base
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 4);
  return initials ? `${initials}-001` : '';
}

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<Project>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<{ project: Project } | null>(null);
  const [saving, setSaving] = useState(false);

  const qs = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(search ? { search } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  }).toString();
  const key = `/api/projects?${qs}`;
  const { data, isLoading } = useSWR(key, fetcher);
  const { data: allData } = useSWR('/api/projects?pageSize=10000', fetcher);
  const rows: Project[] = data?.data || [];
  const allRows: Project[] = allData?.data || [];

  const duplicateCheck = useMemo(() => {
    const name = norm(form.name || '');
    const code = (form.code || '').trim().toUpperCase();
    if (!name && !code) return null;
    const match = allRows.find(
      (r) =>
        r.id !== editing?.id &&
        ((name && norm(r.name || '') === name) ||
          (code && (r.code || '').trim().toUpperCase() === code))
    );
    return match || null;
  }, [form.name, form.code, allRows, editing]);

  const active = allRows.filter((r) => r.status === 'active').length;
  const onHold = allRows.filter((r) => r.status === 'on_hold').length;
  const completed = allRows.filter((r) => r.status === 'completed').length;

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setWarn(null);
    setModalOpen(true);
  };

  const openEdit = (row: Project) => {
    setEditing(row);
    setForm({ ...row });
    setError(null);
    setWarn(null);
    setModalOpen(true);
  };

  const save = async () => {
    setError(null);
    setWarn(null);
    const name = (form.name || '').trim();
    const code = (form.code || '').trim().toUpperCase();
    if (!name) {
      setError('Project name is required.');
      return;
    }
    if (duplicateCheck) {
      setWarn({ project: duplicateCheck });
      return;
    }
    await persist({ ...form, name, code });
  };

  const persist = async (payload: Project) => {
    setSaving(true);
    try {
      if (editing?.id) await apiPut(`/projects/${editing.id}`, payload);
      else await apiPost('/projects', payload);
      mutate(key);
      mutate('/api/projects?pageSize=10000');
      setModalOpen(false);
      setForm(emptyForm);
      setEditing(null);
      setWarn(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Project) => {
    if (!row.id) return;
    if (!confirm(`Delete project "${row.name}"?`)) return;
    try {
      await apiDelete(`/projects/${row.id}`);
      mutate(key);
      mutate('/api/projects?pageSize=10000');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filtersActive = Boolean(search || statusFilter);

  return (
    <>
      <PageHeader
        eyebrow="Master data"
        title="Projects"
        subtitle="Every issuance is attributed to a project. Use the project code to distinguish multiple engagements with the same client."
        actions={
          <Button icon={<IconPlus />} onClick={openNew}>
            New Project
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Total Projects"
          value={allRows.length}
          accent="blue"
          icon={<IconFolder />}
          hint="In the system"
          loading={!allData}
        />
        <KPICard
          label="Active"
          value={active}
          accent="green"
          icon={<IconCheck />}
          hint="Currently active"
          loading={!allData}
        />
        <KPICard
          label="On Hold"
          value={onHold}
          accent="amber"
          icon={<IconFolder />}
          hint="Paused projects"
          loading={!allData}
        />
        <KPICard
          label="Completed"
          value={completed}
          accent="slate"
          icon={<IconFolder />}
          hint="Archived projects"
          loading={!allData}
        />
      </div>

      <FilterBar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search by code, name, client, or site…"
        onReset={
          filtersActive
            ? () => {
                setSearch('');
                setStatusFilter('');
                setPage(1);
              }
            : undefined
        }
      >
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="on_hold">On hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </FilterBar>

      <DataTable
        loading={isLoading}
        columns={[
          {
            key: 'code',
            header: 'Code',
            width: '110px',
            render: (r) =>
              r.code ? (
                <span className="font-mono text-xs bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400 px-2 py-0.5 rounded">
                  {r.code}
                </span>
              ) : (
                <span className="text-slate-400">—</span>
              ),
          },
          {
            key: 'name',
            header: 'Name',
            render: (r) => <span className="font-medium text-slate-900 dark:text-slate-100">{r.name}</span>,
          },
          { key: 'client', header: 'Client' },
          { key: 'site_location', header: 'Site' },
          {
            key: 'status',
            header: 'Status',
            render: (r) => {
              const s = STATUS_LABEL[r.status || ''] ?? { cls: 'bg-slate-100 text-slate-700', label: r.status || '—' };
              return <span className={`badge ${s.cls}`}>{s.label}</span>;
            },
          },
        ]}
        rows={rows}
        emptyTitle="No projects yet"
        emptyDescription="Create a project to start tracking issuances."
        emptyAction={
          <Button icon={<IconPlus />} onClick={openNew}>
            Add project
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
        title={editing ? 'Edit project' : 'New project'}
        subtitle={
          editing
            ? 'Update project details. Code must be unique.'
            : 'Create a project to attribute issuances to. Use a distinct code when you have multiple projects with the same client.'
        }
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {editing ? 'Save changes' : 'Create project'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Code" required hint="Unique identifier (e.g. STAN-001)">
            <div className="flex gap-2">
              <TextInput
                value={form.code ?? ''}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="STAN-001"
                className="uppercase"
              />
              {!editing && (
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, code: suggestCode(f.name, f.client) }))
                  }
                  title="Suggest from name/client"
                  className="text-xs px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Auto
                </button>
              )}
            </div>
          </Field>
          <Field label="Project name" required className="md:col-span-2">
            <TextInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Stanbic Bank HQ Fitout"
            />
          </Field>
          <Field label="Client">
            <TextInput
              value={form.client ?? ''}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
              placeholder="Company name"
            />
          </Field>
          <Field label="Site location" className="md:col-span-2">
            <TextInput
              value={form.site_location ?? ''}
              onChange={(e) => setForm({ ...form, site_location: e.target.value })}
              placeholder="Street, city, building"
            />
          </Field>
          <Field label="Status" className="md:col-span-3">
            <Select
              value={form.status ?? 'active'}
              onChange={(e) => setForm({ ...form, status: e.target.value as any })}
            >
              <option value="active">Active</option>
              <option value="on_hold">On hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </Field>
        </div>

        {duplicateCheck && !warn && (
          <div className="mt-4 text-sm flex items-start gap-2 rounded-lg px-3 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
            <IconAlert width={16} height={16} className="flex-shrink-0 mt-0.5" />
            <div>
              A project already exists with a matching{' '}
              {norm(form.name || '') === norm(duplicateCheck.name || '') ? 'name' : 'code'}:{' '}
              <strong>
                {duplicateCheck.code ? `${duplicateCheck.code} · ` : ''}
                {duplicateCheck.name}
              </strong>
              . Names are matched case-insensitively — consider using a different{' '}
              code to distinguish them.
            </div>
          </div>
        )}

        {warn && (
          <div className="mt-4 text-sm rounded-lg px-3 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
            <div className="font-semibold mb-1">Possible duplicate</div>
            <div>
              <strong>
                {warn.project.code ? `${warn.project.code} · ` : ''}
                {warn.project.name}
              </strong>{' '}
              already exists. Save anyway?
            </div>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="secondary" onClick={() => setWarn(null)}>
                Review
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  persist({
                    ...form,
                    name: (form.name || '').trim(),
                    code: (form.code || '').trim().toUpperCase(),
                  })
                }
                loading={saving}
              >
                Save anyway
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 text-sm text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </Modal>
    </>
  );
}
