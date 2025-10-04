// Simple Odoo API client for the mobile/web UI
// NOTE: Do not hardcode secrets in code. Provide login/apiKey at runtime or via secure storage.

export type OdooConfig = {
  baseUrl: string; // e.g., https://your-odoo-host
  db: string; // database name
  login: string; // Odoo user login
  apiKey: string; // Odoo API key
};

function basicAuth(login: string, apiKey: string) {
  // For native, you may need a base64 polyfill if btoa isn't available
  if (typeof btoa === 'function') return 'Basic ' + btoa(`${login}:${apiKey}`);
  // Fallback: Node-like environments
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const buff = Buffer.from(`${login}:${apiKey}`, 'utf-8');
  return 'Basic ' + buff.toString('base64');
}

async function httpJson<T>(url: string, method: 'POST' | 'GET', body: any | undefined, headers: Record<string, string>) {
  const resp = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  let data: any = null;
  const text = await resp.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!resp.ok) {
    const err = new Error((data && (data.message || data.error)) || `HTTP ${resp.status}`) as any;
    err.status = resp.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

export async function createEmployee(cfg: OdooConfig, payload: {
  name: string;
  work_email?: string;
  work_phone?: string;
  mobile_phone?: string;
  job_title?: string;
  department_id?: number;
  work_location_id?: number;
  image_1920?: string; // base64
}) {
  const url = `${cfg.baseUrl}/odhr/api/employees/create?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<any>(url, 'POST', payload, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

export async function listDepartments(cfg: OdooConfig, params: { search?: string; limit?: number; offset?: number } = {}) {
  const url = `${cfg.baseUrl}/odhr/api/departments?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<any>(url, 'POST', params, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}
