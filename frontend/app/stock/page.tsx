'use client';

import { useState } from 'react';
import useSWR from 'swr';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FilterBar from '@/components/FilterBar';
import KPICard from '@/components/KPICard';
import { Select } from '@/components/FormField';
import { fetcher } from '@/lib/api';
import { fmtQty } from '@/lib/format';
import {
  IconAlert,
  IconArrowDown,
  IconArrowUp,
  IconLayers,
  IconPackage,
} from '@/components/Icons';

export default function StockPage() {
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data: warehouses } = useSWR('/api/warehouses?pageSize=500', fetcher);
  const query = new URLSearchParams({
    ...(search ? { search } : {}),
    ...(warehouseId ? { warehouseId } : {}),
    ...(lowOnly ? { lowStockOnly: 'true' } : {}),
    page: String(page),
    pageSize: String(pageSize),
  }).toString();
  const { data, isLoading } = useSWR(
    `/api/stock/availability?${query}`,
    fetcher
  );
  const rows = data?.data || [];

  const { data: dashboard } = useSWR('/api/stock/dashboard', fetcher);

  const reset = () => {
    setSearch('');
    setWarehouseId('');
    setLowOnly(false);
    setPage(1);
  };
  const filtersActive = Boolean(search || warehouseId || lowOnly);

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Stock Availability"
        subtitle="Computed as Opening + Received + Transferred-In − Transferred-Out − Issued + Adjustments"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="On Hand"
          value={dashboard?.on_hand_total ?? 0}
          accent="green"
          hint="Current quantity across warehouses"
          icon={<IconPackage />}
          loading={!dashboard}
        />
        <KPICard
          label="Received"
          value={dashboard?.received_total ?? 0}
          accent="blue"
          hint="Cumulative received"
          icon={<IconArrowDown />}
          loading={!dashboard}
        />
        <KPICard
          label="Issued"
          value={dashboard?.issued_total ?? 0}
          accent="amber"
          hint="Cumulative issued"
          icon={<IconArrowUp />}
          loading={!dashboard}
        />
        <KPICard
          label="Low Stock"
          value={dashboard?.low_stock_count ?? 0}
          accent="red"
          hint="Items below reorder level"
          icon={<IconAlert />}
          loading={!dashboard}
        />
      </div>

      <FilterBar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search code or description…"
        onReset={filtersActive ? reset : undefined}
      >
        <Select
          value={warehouseId}
          onChange={(e) => {
            setWarehouseId(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        >
          <option value="">All warehouses</option>
          {(warehouses?.data || []).map((w: any) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            checked={lowOnly}
            onChange={(e) => {
              setLowOnly(e.target.checked);
              setPage(1);
            }}
          />
          <span>Low stock only</span>
        </label>
      </FilterBar>

      <DataTable
        loading={isLoading}
        columns={[
          {
            key: 'item_code',
            header: 'Code',
            render: (r) => (
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {r.item_code}
              </span>
            ),
          },
          { key: 'description', header: 'Description' },
          { key: 'warehouse', header: 'Warehouse' },
          { key: 'unit', header: 'Unit' },
          {
            key: 'opening',
            header: 'Opening',
            render: (r) => fmtQty(r.opening),
            className: 'text-right',
          },
          {
            key: 'received',
            header: 'Received',
            render: (r) => (
              <span className="text-brand-700 font-medium">{fmtQty(r.received)}</span>
            ),
            className: 'text-right',
          },
          {
            key: 'issued',
            header: 'Issued',
            render: (r) => (
              <span className="text-amber-700 font-medium">{fmtQty(r.issued)}</span>
            ),
            className: 'text-right',
          },
          {
            key: 'on_hand',
            header: 'On Hand',
            render: (r) => (
              <span
                className={
                  r.is_low_stock
                    ? 'badge bg-rose-100 text-rose-700 font-semibold'
                    : 'badge bg-emerald-100 text-emerald-700 font-semibold'
                }
              >
                {fmtQty(r.on_hand)}
              </span>
            ),
            className: 'text-right',
          },
        ]}
        rows={rows}
        emptyTitle="No stock records"
        emptyDescription={
          filtersActive
            ? 'No items match your filters. Try clearing them.'
            : 'Import opening stock or record receipts to populate availability.'
        }
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
    </>
  );
}
