import { clearAuth, readToken } from './auth';

const BASE = '/api';

function authHeaders(): Record<string, string> {
  const token = readToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function onUnauthorized() {
  clearAuth();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    const next = window.location.pathname + window.location.search;
    window.location.href = `/login?next=${encodeURIComponent(next)}`;
  }
}

async function handle(res: Response) {
  if (res.status === 401) {
    onUnauthorized();
    throw new Error('Session expired. Please sign in again.');
  }
  if (!res.ok) {
    const text = await res.text();
    try {
      const body = JSON.parse(text);
      throw new Error(body?.error || text || `Request failed (${res.status})`);
    } catch {
      throw new Error(text || `Request failed (${res.status})`);
    }
  }
  if (res.status === 204) return undefined as any;
  return res.json();
}

export async function apiGet<T = any>(
  path: string,
  params?: Record<string, any>
): Promise<T> {
  const qs = params
    ? '?' +
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  const res = await fetch(`${BASE}${path}${qs}`, { headers: { ...authHeaders() } });
  return handle(res);
}

export async function apiSend<T = any>(
  method: 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: any
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handle(res);
}

export const apiPost = <T = any>(p: string, b?: any) => apiSend<T>('POST', p, b);
export const apiPut = <T = any>(p: string, b?: any) => apiSend<T>('PUT', p, b);
export const apiDelete = (p: string) => apiSend<void>('DELETE', p);

/** SWR-compatible fetcher that attaches the JWT and handles 401. */
export const fetcher = async (url: string) => {
  const res = await fetch(url, { headers: { ...authHeaders() } });
  return handle(res);
};

/** Upload a file via multipart; auto-attaches the Bearer token. */
export async function apiUpload<T = any>(
  path: string,
  file: File,
  params?: Record<string, string>
): Promise<T> {
  const fd = new FormData();
  fd.append('file', file);
  const qs = params
    ? '?' + new URLSearchParams(params).toString()
    : '';
  const res = await fetch(`${BASE}${path}${qs}`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: fd,
  });
  return handle(res);
}
