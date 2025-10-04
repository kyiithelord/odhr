import { CONFIG } from '../config';
import { getCredentials } from './storage';
import { encode as btoa } from 'base-64';

async function buildHeaders() {
  const { login, apiKey } = await getCredentials();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (login && apiKey) {
    const token = btoa(`${login}:${apiKey}`);
    headers['Authorization'] = `Basic ${token}`;
  }
  return headers;
}

function buildRequestUrl(base: string, path: string) {
  // base may include a query like ?db=xyz. We must preserve it.
  // Ensure path starts with '/'
  const p = path.startsWith('/') ? path : `/${path}`;
  try {
    const b = new URL(base);
    const u = new URL(b.origin);
    u.pathname = p;
    u.search = b.search; // preserve ?db=...
    return u.toString();
  } catch {
    // Fallback: naive concat
    const cleanedBase = base.replace(/\/$/, '');
    return `${cleanedBase}${p}`;
  }
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
  const { baseUrl } = await getCredentials();
  const base = baseUrl || CONFIG.API_BASE_URL;
  const url = buildRequestUrl(base, path);
  const res = await fetch(url, {
    method: 'POST',
    headers: await buildHeaders(),
    body: body ? JSON.stringify(body) : '{}',
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 300)}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    throw new Error(`Invalid JSON from ${url}. First 200 chars: ${text.slice(0, 200)}`);
  }
}

export type EmployeeSummary = {
  id: number;
  name: string;
  work_email?: string;
  work_phone?: string;
  mobile_phone?: string;
  job_title?: string;
  department_id?: { id: number; name: string } | null;
  work_location_id?: { id: number; name: string } | null;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  probation_end_date?: string | null;
};

export type EmployeesResponse = {
  count: number;
  limit: number;
  offset: number;
  items: EmployeeSummary[];
};

export async function listEmployees(params: { limit?: number; offset?: number; search?: string }) {
  return apiPost<EmployeesResponse>('/odhr/api/employees', params);
}

export async function getEmployee(id: number) {
  return apiPost<EmployeeSummary & { image_1920?: string | false }>(`/odhr/api/employees/${id}`);
}
