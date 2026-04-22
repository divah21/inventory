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
import { apiDelete, apiPost, apiPut, fetcher } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import {
  IconAlert,
  IconCheck,
  IconEdit,
  IconPlus,
  IconTrash,
  IconUsers,
  IconUser,
} from '@/components/Icons';
import { useAuth } from '@/lib/auth';

type U = {
  id?: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  is_active?: boolean;
  last_login_at?: string | null;
  password?: string;
};

const emptyForm: U = { email: '', name: '', role: 'user', password: '' };

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<U | null>(null);
  const [form, setForm] = useState<U>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qs = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(search ? { search } : {}),
  }).toString();
  const key = `/api/users?${qs}`;
  const { data, isLoading } = useSWR(key, fetcher);
  const rows: U[] = data?.data || [];

  const admins = rows.filter((r) => r.role === 'admin').length;
  const activeUsers = rows.filter((r) => r.is_active).length;

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (u: U) => {
    setEditing(u);
    setForm({ ...u, password: '' });
    setError(null);
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editing?.id) {
        const payload: any = {
          email: form.email,
          name: form.name,
          role: form.role,
          is_active: form.is_active,
        };
        if (form.password) payload.password = form.password;
        await apiPut(`/users/${editing.id}`, payload);
      } else {
        if (!form.password || form.password.length < 8) {
          setError('Password must be at least 8 characters.');
          setSaving(false);
          return;
        }
        await apiPost('/users', form);
      }
      mutate(key);
      setModalOpen(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (u: U) => {
    if (!u.id) return;
    if (u.id === me?.id) {
      alert('You cannot delete your own account.');
      return;
    }
    if (!confirm(`Delete user ${u.email}?`)) return;
    try {
      await apiDelete(`/users/${u.id}`);
      mutate(key);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Users"
        subtitle="Manage accounts and roles. Admins can see audit logs, import data, and edit master data."
        actions={
          <Button icon={<IconPlus />} onClick={openNew}>
            New User
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Users" value={data?.total ?? rows.length} accent="blue" icon={<IconUsers />} loading={isLoading} />
        <KPICard label="Admins" value={admins} accent="violet" icon={<IconUser />} loading={isLoading} />
        <KPICard label="Active" value={activeUsers} accent="green" icon={<IconCheck />} loading={isLoading} />
        <KPICard label="Inactive" value={rows.length - activeUsers} accent="slate" icon={<IconAlert />} loading={isLoading} />
      </div>

      <FilterBar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search name or email…"
        onReset={search ? () => setSearch('') : undefined}
      />

      <DataTable
        loading={isLoading}
        columns={[
          {
            key: 'email',
            header: 'Email',
            render: (r: U) => <span className="font-mono text-sm text-slate-700 dark:text-slate-200">{r.email}</span>,
          },
          { key: 'name', header: 'Name', render: (r: U) => <span className="font-medium text-slate-900 dark:text-slate-100">{r.name}</span> },
          {
            key: 'role',
            header: 'Role',
            render: (r: U) => (
              <span
                className={`badge capitalize ${
                  r.role === 'admin'
                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300'
                }`}
              >
                {r.role}
              </span>
            ),
          },
          {
            key: 'is_active',
            header: 'Status',
            render: (r: U) => (
              <span
                className={`badge ${
                  r.is_active
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                }`}
              >
                {r.is_active ? 'Active' : 'Disabled'}
              </span>
            ),
          },
          {
            key: 'last_login_at',
            header: 'Last login',
            render: (r: U) => (r.last_login_at ? fmtDate(r.last_login_at) : 'Never'),
          },
        ]}
        rows={rows}
        emptyTitle="No users yet"
        emptyDescription="Create an account to give someone access."
        actions={[
          { label: 'Edit', icon: <IconEdit width={16} height={16} />, onClick: openEdit },
          { label: 'Delete', icon: <IconTrash width={16} height={16} />, variant: 'danger', onClick: remove },
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
        title={editing ? 'Edit user' : 'New user'}
        subtitle={editing ? 'Update the account details.' : 'Create a new account.'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {editing ? 'Save changes' : 'Create user'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name" required>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email" required>
            <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label={editing ? 'New password (optional)' : 'Password'} required={!editing} hint="At least 8 characters">
            <TextInput
              type="password"
              autoComplete="new-password"
              value={form.password ?? ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Field label="Role" required>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </Select>
          </Field>
          {editing && (
            <Field label="Status" className="md:col-span-2">
              <Select
                value={form.is_active ? 'active' : 'disabled'}
                onChange={(e) => setForm({ ...form, is_active: e.target.value === 'active' })}
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </Select>
            </Field>
          )}
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
