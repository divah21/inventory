'use client';

import { useEffect, useRef, useState } from 'react';
import {
  IconChevronDown,
  IconHelp,
  IconLogout,
  IconSettings,
  IconUser,
} from './Icons';
import { useAuth } from '@/lib/auth';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const initials = (user.name || user.email || 'U')
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleLabel = user.role === 'admin' ? 'Administrator' : 'User';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white text-xs font-bold shadow-sm shadow-brand-500/30">
          {initials || <IconUser width={16} height={16} />}
        </div>
        <div className="hidden md:block text-left leading-tight">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[140px]">
            {user.name}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
            {roleLabel}
          </div>
        </div>
        <IconChevronDown
          width={14}
          height={14}
          className={`hidden md:block text-slate-400 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 z-50 origin-top-right animate-scale-in">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-black/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white text-sm font-bold">
                  {initials || <IconUser width={18} height={18} />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {user.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                    {roleLabel}
                  </div>
                </div>
              </div>
            </div>
            <nav className="p-1.5">
              <MenuItem icon={<IconUser width={15} height={15} />} label="Profile" />
              <MenuItem icon={<IconSettings width={15} height={15} />} label="Settings" />
              <MenuItem icon={<IconHelp width={15} height={15} />} label="Help & Support" />
            </nav>
            <div className="p-1.5 border-t border-slate-100 dark:border-slate-800">
              <MenuItem
                icon={<IconLogout width={15} height={15} />}
                label="Sign out"
                danger
                onClick={() => {
                  setOpen(false);
                  logout();
                  window.location.href = '/login';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition ${
        danger
          ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10'
          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <span className="text-slate-400 dark:text-slate-500">{icon}</span>
      {label}
    </button>
  );
}
