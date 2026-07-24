import axios from 'axios';

export const TOKEN_KEY = 'clinic_auth_token';
const USER_INFO_KEY = 'clinic_user_info';

/** API origin only from env — no relative URLs to the Vite dev server. */
function apiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL;
  if (raw == null || String(raw).trim() === '') {
    if (import.meta.env.DEV) {
      console.error(
        '[PhysioAdmin] Missing VITE_API_URL. Add to frontend/.env, e.g. VITE_API_URL=http://localhost:3001'
      );
    }
    return '';
  }
  return String(raw).trim().replace(/\/+$/, '');
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getUserInfo() {
  try {
    const raw = localStorage.getItem(USER_INFO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUserInfo(user) {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
}

export function clearUserInfo() {
  localStorage.removeItem(USER_INFO_KEY);
}

export const api = axios.create({
  baseURL: apiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || '';

    if (status === 401 && !url.includes('/api/auth/login')) {
      clearToken();
      clearUserInfo();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    if (status === 403 && !url.includes('/api/auth/login')) {
      clearToken();
      clearUserInfo();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login?expired=1');
      }
    }

    return Promise.reject(err);
  }
);

function normalizeAttendanceRow(row) {
  let date = '';
  if (typeof row.date === 'string') {
    date = row.date.slice(0, 10);
  } else if (row.date instanceof Date) {
    const d = row.date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dateVal = String(d.getDate()).padStart(2, '0');
    date = `${year}-${month}-${dateVal}`;
  } else {
    date = row.date;
  }
  return {
    id: row.id,
    patient_id: row.patient_id,
    date,
    present: row.present,
  };
}

export async function loginRequest(username, password) {
  const { data } = await api.post('/api/auth/login', { username, password });
  return data;
}

export async function resetPasswordRequest(username) {
  const { data } = await api.post('/api/auth/reset-password', { username });
  return data;
}

export async function fetchPatients(params = {}) {
  const { data } = await api.get('/api/patients', { params });
  return data;
}

export async function fetchPatient(id) {
  const { data } = await api.get(`/api/patients/${id}`);
  return data;
}

export async function createPatient(body) {
  const { data } = await api.post('/api/patients', body);
  return data;
}

export async function updatePatient(id, body) {
  const { data } = await api.patch(`/api/patients/${id}`, body);
  return data;
}

export async function fetchAttendance(params = {}) {
  const { data } = await api.get('/api/attendance', { params });
  return data.map(normalizeAttendanceRow);
}

export async function saveAttendanceBulk(date, entries) {
  await api.post('/api/attendance', { date, entries });
}

export async function markPresentRequest(patientId, date) {
  await api.post('/api/attendance/mark-present', { patient_id: patientId, date });
}

export async function fetchPayments(params = {}) {
  const { data } = await api.get('/api/payments', { params });
  return data.map((p) => ({
    id: p.id,
    patient_id: p.patient_id,
    amount: Number(p.amount),
    payment_type: p.payment_type,
    sessions: Number(p.sessions),
    created_at: p.created_at,
  }));
}

export async function createPayment(body) {
  const { data } = await api.post('/api/payments', body);
  return data;
}

export async function fetchReportsSummary() {
  const { data } = await api.get('/api/reports/summary');
  return data;
}

export async function changePasswordRequest(currentPassword, newPassword) {
  await api.post('/api/auth/change-password', { currentPassword, newPassword });
}

export async function fetchEnquiries() {
  const { data } = await api.get('/api/enquiries');
  return data;
}

export async function createEnquiry(body) {
  const { data } = await api.post('/api/enquiries', body);
  return data;
}

export async function deleteEnquiryRequest(id) {
  const { data } = await api.delete(`/api/enquiries/${id}`);
  return data;
}

// ── Companies (Admin Only) ──

export async function fetchCompanies() {
  const { data } = await api.get('/api/companies');
  return data;
}

export async function createCompany(body) {
  const { data } = await api.post('/api/companies', body);
  return data;
}

export async function updateCompany(id, body) {
  const { data } = await api.patch(`/api/companies/${id}`, body);
  return data;
}

// ── Subscriptions (Admin Only) ──

export async function fetchSubscriptions(companyId) {
  const { data } = await api.get(`/api/subscriptions/${companyId}`);
  return data;
}

export async function createSubscription(body) {
  const { data } = await api.post('/api/subscriptions', body);
  return data;
}

export async function resetCompanyPassword(id) {
  const { data } = await api.post(`/api/companies/${id}/reset-password`);
  return data;
}

export async function updateSubscriptionStatus(id, status) {
  const { data } = await api.patch(`/api/subscriptions/${id}`, { status });
  return data;
}
