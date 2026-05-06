/**
 * FaceMark - Root Application
 * Routing, auth, and global providers
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AppLayout } from './components/Layout';

import LoginPage      from './pages/Login';
import Dashboard      from './pages/Dashboard';
import AttendancePage from './pages/Attendance';
import RegisterFace   from './pages/RegisterFace';
import UsersPage      from './pages/Users';
import ReportsPage    from './pages/Reports';
import LogsPage       from './pages/Logs';
import SettingsPage   from './pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — all authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard"  element={<Dashboard />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/settings"   element={<SettingsPage />} />

              {/* Admin + Teacher */}
              <Route element={<ProtectedRoute roles={['admin','teacher']} />}>
                <Route path="/register" element={<RegisterFace />} />
                <Route path="/reports"  element={<ReportsPage />} />
              </Route>

              {/* Admin only */}
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="/users" element={<UsersPage />} />
                <Route path="/logs"  element={<LogsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            borderRadius: '10px',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
        }}
      />
    </AuthProvider>
  );
}
