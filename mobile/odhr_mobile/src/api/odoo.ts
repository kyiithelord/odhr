// Simple Odoo API client for the mobile/web UI
// NOTE: Do not hardcode secrets in code. Provide login/apiKey at runtime or via secure storage.
import { Buffer } from 'buffer';

export type OdooConfig = {
  baseUrl: string; // e.g., https://your-odoo-host
  db: string; // database name
  login: string; // Odoo user login
  apiKey: string; // Odoo API key
};

function basicAuth(login: string, apiKey: string) {
  // For native, you may need a base64 polyfill if btoa isn't available
  if (typeof btoa === 'function') return 'Basic ' + btoa(`${login}:${apiKey}`);
  // Fallback: environments without btoa (e.g., React Native)
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

// ===== Common Types =====
export type Id = number;
export type DateString = string; // ISO 8601
export type Money = number;

export type Paginated<T> = {
  total: number;
  items: T[];
  limit: number;
  offset: number;
};

export type Success = { ok: true };

// ===== Auth / Session =====
export type Me = {
  user_id: Id;
  employee_id?: Id;
  name: string;
  login: string;
  roles: Array<'employee' | 'manager' | 'hr' | 'admin'>;
  company_id?: Id;
  company_name?: string;
};

export async function whoAmI(cfg: OdooConfig) {
  const url = `${cfg.baseUrl}/odhr/api/auth/me?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<Me>(url, 'GET', undefined, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

// ===== Employee =====
export type Department = {
  id: Id;
  name: string;
  parent_id?: Id | null;
};

export type Employee = {
  id: Id;
  name: string;
  work_email?: string;
  work_phone?: string;
  mobile_phone?: string;
  job_title?: string;
  department_id?: Id | null;
  department_name?: string;
  manager_id?: Id | null;
  manager_name?: string;
  work_location_id?: Id | null;
  join_date?: DateString;
  image_128?: string; // base64 preview
  image_1920?: string; // base64 full
};

export type EmployeeUpdate = Partial<
  Pick<
    Employee,
    | 'work_email'
    | 'work_phone'
    | 'mobile_phone'
    | 'job_title'
    | 'department_id'
    | 'work_location_id'
    | 'image_1920'
  >
>;

export async function getMyProfile(cfg: OdooConfig) {
  const url = `${cfg.baseUrl}/odhr/api/employees/me?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<Employee>(url, 'GET', undefined, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

export async function updateMyProfile(cfg: OdooConfig, changes: EmployeeUpdate) {
  const url = `${cfg.baseUrl}/odhr/api/employees/me/update?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<Employee>(url, 'POST', changes, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

export async function getEmployeeById(cfg: OdooConfig, id: Id) {
  const url = `${cfg.baseUrl}/odhr/api/employees/${id}?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<Employee>(url, 'GET', undefined, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

export async function searchEmployees(
  cfg: OdooConfig,
  params: { q?: string; department_id?: Id; manager_id?: Id; limit?: number; offset?: number } = {}
) {
  const url = `${cfg.baseUrl}/odhr/api/employees/search?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<Paginated<Employee>>(url, 'POST', params, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

export type TeamNode = {
  manager: Employee;
  members: Employee[];
};

export async function getTeamStructure(cfg: OdooConfig, manager_id?: Id) {
  const url = `${cfg.baseUrl}/odhr/api/employees/team?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<TeamNode>(url, 'POST', { manager_id }, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
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

// ===== Attendance =====
export type AttendanceEntry = {
  id: Id;
  check_in: DateString;
  check_out?: DateString | null;
  worked_hours?: number;
  location?: { lat: number; lng: number } | null;
  manual?: boolean;
  reason?: string | null;
};

export async function attendanceCheckIn(
  cfg: OdooConfig,
  payload: { lat?: number; lng?: number; manual?: boolean; reason?: string | null }
) {
  const url = `${cfg.baseUrl}/odhr/api/attendance/checkin?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<AttendanceEntry>(url, 'POST', payload, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

export async function attendanceCheckOut(
  cfg: OdooConfig,
  payload: { lat?: number; lng?: number; manual?: boolean; reason?: string | null }
) {
  const url = `${cfg.baseUrl}/odhr/api/attendance/checkout?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<AttendanceEntry>(url, 'POST', payload, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

export async function attendanceHistory(
  cfg: OdooConfig,
  params: { from?: DateString; to?: DateString; period?: 'daily' | 'weekly' | 'monthly'; limit?: number; offset?: number } = {}
) {
  const url = `${cfg.baseUrl}/odhr/api/attendance/history?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<Paginated<AttendanceEntry>>(url, 'POST', params, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

export type AttendanceAnalytics = {
  total_hours: number;
  overtime_hours: number;
  late_count: number;
  early_leave_count: number;
  days_present: number;
  days_absent: number;
};

export async function attendanceAnalytics(
  cfg: OdooConfig,
  params: { from?: DateString; to?: DateString }
) {
  const url = `${cfg.baseUrl}/odhr/api/attendance/analytics?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<AttendanceAnalytics>(url, 'POST', params, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

// ===== Leave =====
export type LeaveType = { id: Id; name: string; code?: string };
export type LeaveRequest = {
  id: Id;
  type_id: Id;
  type_name?: string;
  date_from: DateString;
  date_to: DateString;
  duration: number; // hours or days depending on policy
  reason?: string;
  state: 'draft' | 'confirm' | 'validate1' | 'validate' | 'refuse' | 'cancel';
  employee_id: Id;
};

export type LeaveBalance = {
  type_id: Id;
  type_name: string;
  remaining: number;
  unit: 'days' | 'hours';
};

export async function listLeaveTypes(cfg: OdooConfig) {
  const url = `${cfg.baseUrl}/odhr/api/leave/types?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<LeaveType[]>(url, 'GET', undefined, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

export async function applyLeave(
  cfg: OdooConfig,
  payload: { type_id: Id; date_from: DateString; date_to: DateString; reason?: string }
) {
  const url = `${cfg.baseUrl}/odhr/api/leave/apply?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<LeaveRequest>(url, 'POST', payload, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

export async function listMyLeaves(
  cfg: OdooConfig,
  params: { state?: string[]; limit?: number; offset?: number } = {}
) {
  const url = `${cfg.baseUrl}/odhr/api/leave/my?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<Paginated<LeaveRequest>>(url, 'POST', params, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

export async function leaveBalances(cfg: OdooConfig) {
  const url = `${cfg.baseUrl}/odhr/api/leave/balances?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<LeaveBalance[]>(url, 'GET', undefined, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

export async function approveLeave(cfg: OdooConfig, leave_id: Id) {
  const url = `${cfg.baseUrl}/odhr/api/leave/${leave_id}/approve?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<LeaveRequest>(url, 'POST', {}, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

export async function rejectLeave(cfg: OdooConfig, leave_id: Id, reason?: string) {
  const url = `${cfg.baseUrl}/odhr/api/leave/${leave_id}/reject?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<LeaveRequest>(url, 'POST', { reason }, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

export async function teamLeaveCalendar(
  cfg: OdooConfig,
  params: { from: DateString; to: DateString; team_manager_id?: Id }
) {
  const url = `${cfg.baseUrl}/odhr/api/leave/calendar?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<LeaveRequest[]>(url, 'POST', params, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

// ===== Payroll / Payslips =====
export type Payslip = {
  id: Id;
  name: string; // period
  date_from: DateString;
  date_to: DateString;
  net_wage: Money;
  state: string;
};

export type SalaryLine = { code: string; name: string; amount: Money };

export async function listPayslips(cfg: OdooConfig, params: { limit?: number; offset?: number } = {}) {
  const url = `${cfg.baseUrl}/odhr/api/payroll/payslips?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<Paginated<Payslip>>(url, 'POST', params, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

export async function getPayslipDetails(cfg: OdooConfig, id: Id) {
  const url = `${cfg.baseUrl}/odhr/api/payroll/payslips/${id}?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<{ payslip: Payslip; lines: SalaryLine[] }>(url, 'GET', undefined, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

export async function getPayslipPDF(cfg: OdooConfig, id: Id) {
  const url = `${cfg.baseUrl}/odhr/api/payroll/payslips/${id}/pdf?db=${encodeURIComponent(cfg.db)}`;
  // Returns base64 PDF string to render/download client-side
  return httpJson<{ filename: string; pdf_base64: string }>(url, 'GET', undefined, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

// ===== Announcements / News =====
export type Announcement = {
  id: Id;
  subject: string;
  body_html?: string;
  body_text?: string;
  date: DateString;
  author_name?: string;
};

export async function listAnnouncements(
  cfg: OdooConfig,
  params: { limit?: number; offset?: number } = {}
) {
  const url = `${cfg.baseUrl}/odhr/api/announcements?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<Paginated<Announcement>>(url, 'POST', params, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

// ===== Devices / Notifications =====
export async function registerDeviceToken(cfg: OdooConfig, payload: { platform: 'android' | 'ios' | 'web'; token: string }) {
  const url = `${cfg.baseUrl}/odhr/api/devices/register?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<Success>(url, 'POST', payload, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

// ===== Manager/Admin actions (stubs aligned to RBAC) =====
export async function managerTeamOverview(
  cfg: OdooConfig,
  params: { manager_id?: Id; from?: DateString; to?: DateString }
) {
  const url = `${cfg.baseUrl}/odhr/api/manager/team_overview?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<any>(url, 'POST', params, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

export async function approveExpense(cfg: OdooConfig, expense_id: Id) {
  const url = `${cfg.baseUrl}/odhr/api/expense/${expense_id}/approve?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<Success>(url, 'POST', {}, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

// ===== Files / Uploads (ESS) =====
export async function uploadDocument(
  cfg: OdooConfig,
  payload: { filename: string; mimetype: string; base64: string; category?: string }
) {
  const url = `${cfg.baseUrl}/odhr/api/files/upload?db=${encodeURIComponent(cfg.db)}`;
  return httpJson<{ attachment_id: Id }>(url, 'POST', payload, { Authorization: basicAuth(cfg.login, cfg.apiKey) });
}

// NOTE: The above endpoints assume custom Odoo controllers under the /odhr/api/* namespace.
// Integrate with Odoo HR, Attendance, Time Off, Payroll, Discuss modules server-side accordingly.
