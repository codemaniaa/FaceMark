/**
 * FaceMark - API Client
 * Centralized Axios instance with JWT auth interceptors
 */
import axios from "axios";

 
const token = localStorage.getItem("access");

if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ─── Request Interceptor: attach JWT ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: auto-refresh on 401 ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        localStorage.setItem('access_token', res.data.access);
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
        return api(originalRequest);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  login:          (data) => api.post('/auth/login/', data),
  logout:         (data) => api.post('/auth/logout/', data),
  me:             ()     => api.get('/auth/me/'),
  changePassword: (data) => api.post('/auth/change-password/', data),
};

// ─── Users API ────────────────────────────────────────────────────────────────
export const usersAPI = {
  list:        (params) => api.get('/users/', { params }),
  get:         (id)     => api.get(`/users/${id}/`),
  create:      (data)   => api.post('/users/', data),
  update:      (id, d)  => api.patch(`/users/${id}/`, d),
  delete:      (id)     => api.delete(`/users/${id}/`),
  stats:       ()       => api.get('/users/stats/'),
  bulkImport:  (form)   => api.post('/users/bulk_import/', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  auditLogs:   (params) => api.get('/users/audit-logs/', { params }),
};

// ─── Face API ─────────────────────────────────────────────────────────────────
export const faceAPI = {
  register: (data) => api.post('/face/register/', data, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
}),
  recognize: (data) => api.post('/face/recognize/', data),
  status:    (uid)  => api.get(`/face/status/${uid}/`),
  delete:    (uid)  => api.delete(`/face/delete/${uid}/`),
};

// ─── Attendance API ───────────────────────────────────────────────────────────
export const attendanceAPI = {
  list:            (params)    => api.get('/attendance/records/', { params }),
  today:           (params)    => api.get('/attendance/records/today/', { params }),
  range:           (params)    => api.get('/attendance/records/range/', { params }),
  summary:         (params)    => api.get('/attendance/records/summary/', { params }),
  edit:            (id, data)  => api.patch(`/attendance/records/${id}/`, data),
  dashboard:       ()          => api.get('/attendance/dashboard/'),
  recognitionLogs: (params)    => api.get('/attendance/recognition-logs/', { params }),
  classes:         (params)    => api.get('/attendance/classes/', { params }),
  createClass:     (data)      => api.post('/attendance/classes/', data),
};

// ─── Reports API ─────────────────────────────────────────────────────────────
export const reportsAPI = {
  exportExcel: (params) =>
    api.get('/reports/export/excel/', { params, responseType: 'blob' }),
  exportPDF: (params) =>
    api.get('/reports/export/pdf/', { params, responseType: 'blob' }),
  defaulters: (params) => api.get('/reports/defaulters/', { params }),
};

export default api;
