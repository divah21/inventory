'use client';

import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(t: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const resolved = t === 'system' ? getSystemTheme() : t;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

export function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const v = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const t = readStoredTheme();
    setThemeState(t);
    setResolved(t === 'system' ? getSystemTheme() : t);
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      applyTheme('system');
      setResolved(getSystemTheme());
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = (t: Theme) => {
    window.localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
    setThemeState(t);
    setResolved(t === 'system' ? getSystemTheme() : t);
  };

  return { theme, resolved, setTheme };
}

/** Inline boot script that runs before hydration to prevent FOUC. */
export const themeBootScript = `
(function(){try{
  var t=localStorage.getItem('theme')||'system';
  var sys=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  var r=t==='system'?sys:t;
  var d=document.documentElement;
  if(r==='dark') d.classList.add('dark');
  d.style.colorScheme=r;
}catch(e){}})();
`;
