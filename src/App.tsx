import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import { RequireAuth } from '@/components/RequireAuth';
import { AppLayout } from '@/layouts/AppLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { EmployeeLayout } from '@/layouts/EmployeeLayout';

const LandingPage = lazy(async () => {
  const module = await import('@/pages/LandingPage');
  return { default: module.LandingPage };
});

const LoginPage = lazy(async () => {
  const module = await import('@/pages/LoginPage');
  return { default: module.LoginPage };
});

const EmployeeLoginPage = lazy(async () => {
  const module = await import('@/pages/EmployeeLoginPage');
  return { default: module.EmployeeLoginPage };
});

const RegisterPage = lazy(async () => {
  const module = await import('@/pages/RegisterPage');
  return { default: module.RegisterPage };
});

const TrackComplaintPage = lazy(async () => {
  const module = await import('@/pages/TrackComplaintPage');
  return { default: module.TrackComplaintPage };
});

const SubmitComplaintPage = lazy(async () => {
  const module = await import('@/pages/SubmitComplaintPage');
  return { default: module.SubmitComplaintPage };
});

const AdminDashboardPage = lazy(async () => {
  const module = await import('@/pages/AdminDashboardPage');
  return { default: module.AdminDashboardPage };
});

const AdminComplaintsPage = lazy(async () => {
  const module = await import('@/pages/AdminComplaintsPage');
  return { default: module.AdminComplaintsPage };
});

const AdminAnalyticsPage = lazy(async () => {
  const module = await import('@/pages/AdminAnalyticsPage');
  return { default: module.AdminAnalyticsPage };
});

const AdminUsersPage = lazy(async () => {
  const module = await import('@/pages/AdminUsersPage');
  return { default: module.AdminUsersPage };
});

const AdminSettingsPage = lazy(async () => {
  const module = await import('@/pages/AdminSettingsPage');
  return { default: module.AdminSettingsPage };
});

const EmployeeDashboardPage = lazy(async () => {
  const module = await import('@/pages/EmployeeDashboardPage');
  return { default: module.EmployeeDashboardPage };
});

const EmployeeMyComplaintsPage = lazy(async () => {
  const module = await import('@/pages/EmployeeMyComplaintsPage');
  return { default: module.EmployeeMyComplaintsPage };
});

const EmployeeSubmitComplaintPage = lazy(async () => {
  const module = await import('@/pages/EmployeeSubmitComplaintPage');
  return { default: module.EmployeeSubmitComplaintPage };
});

const NotFoundPage = lazy(async () => {
  const module = await import('@/pages/NotFoundPage');
  return { default: module.NotFoundPage };
});

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm tracking-widest uppercase">Loading TRINETRA</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route element={<AppLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="submit-complaint" element={<SubmitComplaintPage />} />
            <Route path="track-complaint" element={<TrackComplaintPage />} />
            <Route path="auth/admin-login" element={<LoginPage />} />
            <Route path="auth/employee-login" element={<EmployeeLoginPage />} />
            <Route path="auth/register" element={<RegisterPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          {/* Protected admin routes */}
          <Route element={<RequireAuth allowedRoles={['ADMIN']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="admin/complaints" element={<AdminComplaintsPage />} />
              <Route path="admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="admin/users" element={<AdminUsersPage />} />
              <Route path="admin/settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>

          {/* Protected employee routes */}
          <Route element={<RequireAuth allowedRoles={['EMPLOYEE']} />}>
            <Route element={<EmployeeLayout />}>
              <Route path="employee/dashboard" element={<EmployeeDashboardPage />} />
              <Route path="employee/my-complaints" element={<EmployeeMyComplaintsPage />} />
              <Route path="employee/submit-complaint" element={<EmployeeSubmitComplaintPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
