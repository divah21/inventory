'use client';

import SimpleMasterPage from '@/components/SimpleMasterPage';
import KPICard from '@/components/KPICard';
import { IconUsers, IconTruck } from '@/components/Icons';

export default function SuppliersPage() {
  return (
    <SimpleMasterPage
      eyebrow="Master data"
      title="Suppliers"
      subtitle="Vendors delivering stock into warehouses."
      resource="suppliers"
      stats={(rows) => {
        const withEmail = rows.filter((r: any) => r.email).length;
        const withPhone = rows.filter((r: any) => r.phone).length;
        const withContact = rows.filter((r: any) => r.contact_person).length;
        return (
          <>
            <KPICard label="Suppliers" value={rows.length} accent="violet" icon={<IconTruck />} hint="Active vendor list" />
            <KPICard label="With Contact" value={withContact} accent="blue" icon={<IconUsers />} hint="Named contact person" />
            <KPICard label="With Phone" value={withPhone} accent="green" icon={<IconUsers />} hint="Phone recorded" />
            <KPICard label="With Email" value={withEmail} accent="slate" icon={<IconUsers />} hint="Email recorded" />
          </>
        );
      }}
      columns={[
        {
          key: 'name',
          header: 'Name',
          render: (r: any) => <span className="font-medium text-slate-900 dark:text-slate-100">{r.name}</span>,
        },
        { key: 'contact_person', header: 'Contact' },
        {
          key: 'phone',
          header: 'Phone',
          render: (r: any) =>
            r.phone ? (
              <a className="text-brand-600 hover:underline" href={`tel:${r.phone}`}>{r.phone}</a>
            ) : (
              <span className="text-slate-400">—</span>
            ),
        },
        {
          key: 'email',
          header: 'Email',
          render: (r: any) =>
            r.email ? (
              <a className="text-brand-600 hover:underline" href={`mailto:${r.email}`}>{r.email}</a>
            ) : (
              <span className="text-slate-400">—</span>
            ),
        },
      ]}
      formFields={[
        { key: 'name', label: 'Supplier name', required: true },
        { key: 'contact_person', label: 'Contact person' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email', type: 'email' },
      ]}
    />
  );
}
