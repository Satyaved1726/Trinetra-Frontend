import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import { RequireAuth } from '@/components/RequireAuth';
import { AppLayout } from '@/layouts/AppLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { EmployeeLayout } from '@/layouts/EmployeeLayout';
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout';

const LandingPage = lazy(async () => {
  const module = await import('@/pages/LandingPage');
  return { default: module.LandingPage };
});

const LoginPage = lazy(async () => {
  const module = await import('@/pages/LoginPage');
  return { default: module.LoginPage };
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

const AdminComplaintDetailPage = lazy(async () => {
  const module = await import('@/pages/AdminComplaintDetailPage');
  return { default: module.AdminComplaintDetailPage };
});

const AdminAnalyticsPage = lazy(async () => {
  const module = await import('@/pages/AdminAnalyticsPage');
  return { default: module.AdminAnalyticsPage };
});

const AdminReportsPage = lazy(async () => {
  const module = await import('@/pages/AdminReportsPage');
  return { default: module.AdminReportsPage };
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

const SuperAdminDashboardPage = lazy(async () => {
  const module = await import('@/pages/SuperAdminDashboardPage');
  return { default: module.SuperAdminDashboardPage };
});

const SuperAdminAdminsPage = lazy(async () => {
  const module = await import('@/pages/SuperAdminAdminsPage');
  return { default: module.SuperAdminAdminsPage };
});

const SuperAdminCreateAdminPage = lazy(async () => {
  const module = await import('@/pages/SuperAdminCreateAdminPage');
  return { default: module.SuperAdminCreateAdminPage };
});

const SuperAdminSystemAnalyticsPage = lazy(async () => {
  const module = await import('@/pages/SuperAdminSystemAnalyticsPage');
  return { default: module.SuperAdminSystemAnalyticsPage };
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
            <Route path="auth/login" element={<LoginPage />} />
            <Route path="auth/register" element={<RegisterPage />} />
            <Route path="auth/admin-login" element={<Navigate to="/auth/login" replace />} />
            <Route path="auth/employee-login" element={<Navigate to="/auth/login" replace />} />
            <Route path="login" element={<Navigate to="/auth/login" replace />} />
            <Route path="register" element={<Navigate to="/auth/register" replace />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={['SUPER_ADMIN']} />}>
            <Route element={<SuperAdminLayout />}>
              <Route path="super-admin/dashboard" element={<SuperAdminDashboardPage />} />
              <Route path="super-admin/admins" element={<SuperAdminAdminsPage />} />
              <Route path="super-admin/create-admin" element={<SuperAdminCreateAdminPage />} />
              <Route path="super-admin/system-analytics" element={<SuperAdminSystemAnalyticsPage />} />
            </Route>
          </Route>

          {/* Protected admin routes */}
          <Route element={<RequireAuth allowedRoles={['ADMIN']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="admin/complaints" element={<AdminComplaintsPage />} />
              <Route path="admin/complaints/:id" element={<AdminComplaintDetailPage />} />
              <Route path="admin/reports" element={<AdminReportsPage />} />
              <Route path="admin/analytics" element={<AdminAnalyticsPage />} />
            </Route>
          </Route>

          {/* Protected employee routes */}
          <Route element={<RequireAuth allowedRoles={['EMPLOYEE']} />}>
            <Route element={<EmployeeLayout />}>
              <Route path="employee/dashboard" element={<EmployeeDashboardPage />} />
              <Route path="employee/my-complaints" element={<EmployeeMyComplaintsPage />} />
              <Route path="employee/submit-complaint" element={<EmployeeSubmitComplaintPage />} />
              <Route path="employee/track-complaint" element={<TrackComplaintPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
