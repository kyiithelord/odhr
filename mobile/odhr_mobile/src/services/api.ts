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

function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, '');
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
  const { baseUrl } = await getCredentials();
  const base = normalizeBaseUrl(baseUrl || CONFIG.API_BASE_URL);
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: await buildHeaders(),
    body: body ? JSON.stringify(body) : '{}',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
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
