'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { classNames } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import {
  IconDashboard,
  IconUpload,
  IconBox,
  IconLayers,
  IconInbox,
  IconArrowDown,
  IconArrowUp,
  IconRefresh,
  IconCalendar,
  IconTrending,
  IconFolder,
  IconWarehouse,
  IconUsers,
  IconPackage,
  IconSettings,
} from './Icons';

type NavLink = {
  label: string;
  href: string;
  group?: string;
  icon: ReactNode;
  adminOnly?: boolean;
};

const LINKS: NavLink[] = [
  { label: 'Dashboard', href: '/', icon: <IconDashboard /> },

  { label: 'Import from Excel', href: '/upload', group: 'Inventory', icon: <IconUpload />, adminOnly: true },
  { label: 'Stock Availability', href: '/stock', group: 'Inventory', icon: <IconLayers /> },
  { label: 'Items', href: '/items', group: 'Inventory', icon: <IconBox /> },

  { label: 'Opening Stock', href: '/opening-stock', group: 'Transactions', icon: <IconPackage /> },
  { label: 'Stock Received', href: '/receipts', group: 'Transactions', icon: <IconArrowDown /> },
  { label: 'Issued Material', href: '/issued', group: 'Transactions', icon: <IconArrowUp /> },
  { label: 'Transfers', href: '/transfers', group: 'Transactions', icon: <IconRefresh /> },

  { label: 'Weekly Summary', href: '/reports/weekly', group: 'Reports', icon: <IconCalendar /> },
  { label: 'Monthly Summary', href: '/reports/monthly', group: 'Reports', icon: <IconTrending /> },

  { label: 'Projects', href: '/projects', group: 'Master data', icon: <IconFolder /> },
  { label: 'Warehouses', href: '/warehouses', group: 'Master data', icon: <IconWarehouse /> },
  { label: 'Suppliers', href: '/suppliers', group: 'Master data', icon: <IconUsers /> },

  { label: 'Audit Logs', href: '/admin/audit-logs', group: 'Admin', icon: <IconSettings />, adminOnly: true },
  { label: 'Users', href: '/admin/users', group: 'Admin', icon: <IconUsers />, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const visible = LINKS.filter((l) => !l.adminOnly || isAdmin);
  const groups: Record<string, NavLink[]> = {};
  visible.forEach((l) => {
    const key = l.group || 'Overview';
    groups[key] ??= [];
    groups[key].push(l);
  });

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 h-16">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white shadow-sm shadow-brand-500/30">
          <IconInbox width={18} height={18} />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-slate-900 dark:text-slate-100 leading-tight">Interplumb</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Inventory System
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4 space-y-5">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <div className="px-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {group}
            </div>
            <ul className="space-y-0.5">
              {items.map((l) => {
                const active =
                  pathname === l.href ||
                  (l.href !== '/' && pathname.startsWith(l.href));
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={classNames(
                        'group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition relative',
                        active
                          ? 'bg-gradient-to-r from-brand-50 to-brand-50/40 dark:from-brand-500/15 dark:to-brand-500/5 text-brand-700 dark:text-brand-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-brand-500 to-brand-600" />
                      )}
                      <span
                        className={classNames(
                          'w-5 h-5 flex items-center justify-center transition',
                          active
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                        )}
                      >
                        {l.icon}
                      </span>
                      <span className="truncate">{l.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 text-[11px] text-slate-400 dark:text-slate-500">
        v1.0 · Interplumb © {new Date().getFullYear()}
      </div>
    </aside>
  );
}
