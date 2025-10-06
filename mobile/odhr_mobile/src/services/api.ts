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
  const timeoutMs = 30000; // 30s
  let res: Response | null = null;
  let lastErr: any = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: await buildHeaders(),
        body: body ? JSON.stringify(body) : '{}',
        signal: controller.signal,
      } as RequestInit);
      clearTimeout(t);
      break; // success
    } catch (e: any) {
      clearTimeout(t);
      lastErr = e;
      const isTimeout = e?.name === 'AbortError' || /timeout/i.test(String(e?.message || ''));
      const isNet = /Network error|Failed to fetch/i.test(String(e?.message || ''));
      if (attempt === 2 || (!isTimeout && !isNet)) {
        if (e?.name === 'AbortError') throw new Error(`Request timeout after ${timeoutMs / 1000}s: ${url}`);
        throw new Error(`Network error calling ${url}: ${e?.message || e}`);
      }
      // small backoff before retry
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  if (!res) {
    throw new Error(`Network error calling ${url}: ${lastErr?.message || lastErr || 'unknown'}`);
  }
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

// Leaves
export type LeaveItem = {
  id: number;
  employee_id: { id: number; name: string } | null;
  holiday_status_id: { id: number; name: string } | null;
  request_date_from?: string;
  request_date_to?: string;
  number_of_days?: number;
  state?: string;
};

export type LeavesResponse = {
  count: number;
  limit: number;
  offset: number;
  items: LeaveItem[];
};

export async function listLeaves(params: { employee_id?: number; state?: string; date_from?: string; date_to?: string; limit?: number; offset?: number }) {
  return apiPost<LeavesResponse>('/odhr/api/leaves', params);
}

export async function createLeave(params: { employee_id: number; holiday_status_id: number; request_date_from: string; request_date_to: string; name?: string }) {
  return apiPost<LeaveItem>('/odhr/api/leaves/create', params);
}

// Attendance
export type AttendanceItem = {
  id: number;
  employee_id: { id: number; name: string } | null;
  check_in?: string;
  check_out?: string | null;
  worked_hours?: number;
};

export type AttendancesResponse = {
  count: number;
  limit: number;
  offset: number;
  items: AttendanceItem[];
};

export async function listAttendances(params: { employee_id?: number; date_from?: string; date_to?: string; limit?: number; offset?: number }) {
  return apiPost<AttendancesResponse>('/odhr/api/attendances', params);
}

export async function createAttendance(params: { employee_id: number; check_in: string; check_out?: string }) {
  return apiPost<AttendanceItem>('/odhr/api/attendances/create', params);
}
