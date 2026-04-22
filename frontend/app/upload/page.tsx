'use client';

import { useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import DataTable from '@/components/DataTable';
import { apiPost, apiUpload, fetcher } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import {
  IconUpload,
  IconCheck,
  IconAlert,
  IconX,
  IconRefresh,
} from '@/components/Icons';

type ImportSummary = {
  warehouses_from_settings: number;
  opening_stock_rows: number;
  stock_received_rows: number;
  issued_material_rows: number;
  price_list_rows: number;
};

type UploadResponse = {
  ok: boolean;
  batch_id: number;
  filename: string;
  size_bytes: number;
  imported: ImportSummary;
};

type Batch = {
  id: number;
  filename: string;
  size_bytes: number;
  summary?: ImportSummary;
  status: 'completed' | 'reverted' | 'failed';
  created_at: string;
  reverted_at?: string | null;
  uploader?: { id: number; email: string; name: string } | null;
  reverter?: { id: number; email: string; name: string } | null;
};

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarn, setDuplicateWarn] = useState<{ batch_id: number; filename: string } | null>(null);

  const batchesKey = '/api/uploads/batches?pageSize=25';
  const { data: batches, isLoading: batchesLoading } = useSWR(batchesKey, fetcher);

  const pick = (f: File | null | undefined) => {
    setResult(null);
    setError(null);
    setDuplicateWarn(null);
    if (!f) return;
    const lower = f.name.toLowerCase();
    if (!lower.endsWith('.xlsx') && !lower.endsWith('.xlsm')) {
      setError('Only .xlsx or .xlsm files are accepted.');
      return;
    }
    setFile(f);
  };

  const submit = async (force = false) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setDuplicateWarn(null);
    try {
      const qs = force ? { force: 'true' } : undefined;
      const json = await apiUpload<UploadResponse>('/uploads/excel', file, qs);
      setResult(json);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      mutate(batchesKey);
    } catch (e: any) {
      // Duplicate-file 409 surfaces with the hint in message
      const msg = String(e?.message || '');
      if (msg.toLowerCase().includes('already been imported')) {
        setDuplicateWarn({ batch_id: 0, filename: file.name });
      } else {
        setError(msg || 'Upload failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const revert = async (batchId: number) => {
    if (!confirm(`Revert batch #${batchId}? All transactional rows imported in this batch will be deleted.`)) {
      return;
    }
    try {
      await apiPost(`/uploads/batches/${batchId}/revert`);
      mutate(batchesKey);
    } catch (e: any) {
      alert(e.message || 'Revert failed');
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Upload Excel Workbook"
        subtitle="Import SETTINGS, OPENING STOCK, STOCK RECEIVED, ISSUED MATERIAL, and Price List sheets. Every upload is tracked as a batch and can be reverted."
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files?.[0]);
        }}
        className={`card p-12 text-center border-2 border-dashed transition-all ${
          dragging
            ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10 scale-[1.005]'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <div
          className={`mx-auto w-16 h-16 rounded-2xl grid place-items-center mb-4 transition ${
            dragging
              ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30'
              : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-500 dark:text-slate-400'
          }`}
        >
          <IconUpload width={28} height={28} />
        </div>
        <div className="text-slate-900 dark:text-slate-100 font-semibold text-lg mb-1">
          Drag & drop your Excel file here
        </div>
        <div className="text-slate-500 dark:text-slate-400 text-sm mb-5">
          or click below to browse — .xlsx or .xlsm (max 50 MB)
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <Button variant="secondary" onClick={() => inputRef.current?.click()}>
          Choose file
        </Button>

        {file && (
          <div className="mt-6">
            <div className="inline-flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-400 grid place-items-center text-xs font-bold">
                XLS
              </div>
              <div className="text-left">
                <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{file.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
              <button
                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 p-1 rounded transition"
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
              >
                <IconX width={16} height={16} />
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Button
            variant="primary"
            size="lg"
            disabled={!file || loading}
            loading={loading}
            onClick={() => submit(false)}
            icon={!loading ? <IconUpload width={16} height={16} /> : undefined}
          >
            {loading ? 'Importing…' : 'Upload and import'}
          </Button>
        </div>

        <div className="mt-5 text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Each import is tagged as a batch. Master data (items, warehouses, projects) is upserted
          and kept on revert; only the imported transaction rows are removed.
        </div>
      </div>

      {duplicateWarn && (
        <div className="mt-6 card p-4 border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 text-sm flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 grid place-items-center flex-shrink-0">
            <IconAlert width={16} height={16} />
          </div>
          <div className="flex-1">
            <div className="font-semibold">This file has already been imported.</div>
            <div>Its contents matched an earlier batch. Import it anyway?</div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setDuplicateWarn(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => submit(true)} loading={loading}>
                Force import
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 card p-4 border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 grid place-items-center flex-shrink-0">
            <IconAlert width={16} height={16} />
          </div>
          <div>
            <div className="font-semibold">Import failed</div>
            <div className="text-rose-600 dark:text-rose-300">{error}</div>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 grid place-items-center">
                <IconCheck width={18} height={18} />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Imported — Batch #{result.batch_id}
                </div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{result.filename}</div>
              </div>
            </div>
            <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 font-semibold">
              Success
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            {[
              ['Warehouses', result.imported.warehouses_from_settings],
              ['Opening stock', result.imported.opening_stock_rows],
              ['Stock received', result.imported.stock_received_rows],
              ['Issued material', result.imported.issued_material_rows],
              ['Price list', result.imported.price_list_rows],
            ].map(([label, n]) => (
              <div
                key={label as string}
                className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/40"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {label as string}
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
                  {Number(n).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batch history */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Import history</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Each batch lists rows created. Revert deletes them (master data is kept).
            </p>
          </div>
        </div>
        <DataTable
          loading={batchesLoading}
          columns={[
            {
              key: 'id',
              header: '#',
              width: '60px',
              render: (r: Batch) => (
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  #{r.id}
                </span>
              ),
            },
            {
              key: 'filename',
              header: 'File',
              render: (r: Batch) => (
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {r.filename || '—'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {r.size_bytes ? `${(r.size_bytes / (1024 * 1024)).toFixed(2)} MB` : ''}
                  </div>
                </div>
              ),
            },
            {
              key: 'summary',
              header: 'Rows',
              render: (r: Batch) => {
                const s = r.summary;
                if (!s) return <span className="text-slate-400">—</span>;
                const total =
                  (s.opening_stock_rows || 0) +
                  (s.stock_received_rows || 0) +
                  (s.issued_material_rows || 0) +
                  (s.price_list_rows || 0);
                return (
                  <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
                    {total.toLocaleString()}
                  </span>
                );
              },
            },
            {
              key: 'uploader',
              header: 'Uploaded by',
              render: (r: Batch) => r.uploader?.name || r.uploader?.email || '—',
            },
            {
              key: 'created_at',
              header: 'When',
              render: (r: Batch) => fmtDate(r.created_at),
            },
            {
              key: 'status',
              header: 'Status',
              render: (r: Batch) => {
                const cls =
                  r.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                    : r.status === 'reverted'
                    ? 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400';
                return <span className={`badge ${cls} capitalize`}>{r.status}</span>;
              },
            },
            {
              key: 'actions',
              header: '',
              className: 'text-right',
              render: (r: Batch) =>
                r.status === 'completed' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<IconRefresh width={14} height={14} />}
                    onClick={() => revert(r.id)}
                  >
                    Revert
                  </Button>
                ) : r.status === 'reverted' ? (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Reverted {fmtDate(r.reverted_at || undefined)}
                  </span>
                ) : null,
            },
          ]}
          rows={batches?.data || []}
          emptyTitle="No imports yet"
          emptyDescription="Uploaded files will be listed here, along with a revert action."
        />
      </div>
    </>
  );
}
