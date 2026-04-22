'use client';

import { usePathname } from 'next/navigation';
import { IconBell, IconChevronRight, IconSearch } from './Icons';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/upload': 'Import from Excel',
  '/stock': 'Stock Availability',
  '/items': 'Items',
  '/opening-stock': 'Opening Stock',
  '/receipts': 'Stock Received',
  '/issued': 'Issued Material',
  '/transfers': 'Transfers',
  '/reports/weekly': 'Weekly Summary',
  '/reports/monthly': 'Monthly Summary',
  '/projects': 'Projects',
  '/warehouses': 'Warehouses',
  '/suppliers': 'Suppliers',
};

export default function Topbar() {
  const pathname = usePathname();
  const title =
    PAGE_TITLES[pathname] ??
    PAGE_TITLES[`/${pathname.split('/')[1]}`] ??
    'Interplumb';

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-3 px-4 md:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md backdrop-saturate-150">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
          Inventory
        </span>
        <IconChevronRight
          width={14}
          height={14}
          className="text-slate-300 dark:text-slate-600 hidden sm:block"
        />
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
          {title}
        </span>
      </div>

      <div className="hidden lg:flex flex-1 max-w-md mx-auto">
        <div className="relative w-full">
          <IconSearch
            width={15}
            height={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search items, projects, warehouses…"
            className="w-full pl-9 pr-12 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden xl:inline-flex items-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <ThemeToggle />

        <button
          className="relative h-9 w-9 grid place-items-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition"
          aria-label="Notifications"
        >
          <IconBell width={18} height={18} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

        <UserMenu />
      </div>
    </header>
  );
}
