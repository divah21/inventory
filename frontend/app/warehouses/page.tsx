'use client';

import SimpleMasterPage from '@/components/SimpleMasterPage';
import KPICard from '@/components/KPICard';
import { IconWarehouse, IconLayers } from '@/components/Icons';

export default function WarehousesPage() {
  return (
    <SimpleMasterPage
      eyebrow="Master data"
      title="Warehouses"
      subtitle="Container locations and stock storage points."
      resource="warehouses"
      stats={(rows) => {
        const withLocation = rows.filter((r: any) => r.location).length;
        const withCode = rows.filter((r: any) => r.code).length;
        return (
          <>
            <KPICard label="Warehouses" value={rows.length} accent="violet" icon={<IconWarehouse />} hint="In the system" />
            <KPICard label="With Location" value={withLocation} accent="blue" icon={<IconLayers />} hint="Location recorded" />
            <KPICard label="With Codes" value={withCode} accent="slate" icon={<IconLayers />} hint="Short-code set" />
            <KPICard label="Missing Codes" value={rows.length - withCode} accent="amber" icon={<IconLayers />} hint="Codes to fill in" />
          </>
        );
      }}
      columns={[
        {
          key: 'name',
          header: 'Name',
          render: (r: any) => <span className="font-medium text-slate-900 dark:text-slate-100">{r.name}</span>,
        },
        {
          key: 'code',
          header: 'Code',
          render: (r: any) =>
            r.code ? (
              <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {r.code}
              </span>
            ) : (
              <span className="text-slate-400">—</span>
            ),
        },
        { key: 'location', header: 'Location' },
      ]}
      formFields={[
        { key: 'name', label: 'Warehouse name', required: true },
        { key: 'code', label: 'Short code' },
        { key: 'location', label: 'Physical location' },
      ]}
    />
  );
}
