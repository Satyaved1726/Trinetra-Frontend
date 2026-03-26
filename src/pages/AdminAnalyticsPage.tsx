import { motion } from 'framer-motion';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { adminService, type AdminAnalyticsResponse } from '@/services/adminService';
import { toApiError } from '@/services/httpClient';

const pieColors = ['#38bdf8', '#22c55e', '#f59e0b', '#f43f5e', '#a78bfa', '#14b8a6'];

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function ensureAnalyticsArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

const emptyAnalytics: AdminAnalyticsResponse = {
  totalComplaints: 0,
  openComplaints: 0,
  resolvedComplaints: 0,
  anonymousComplaints: 0,
  complaintsOverTime: [],
  complaintsByCategory: [],
  complaintsByStatus: []
};

function KpiCard({ title, value }: { title: string; value: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-slate-800 bg-slate-900/95 p-5 shadow-[0_16px_38px_rgba(2,6,23,0.55)]"
    >
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{title}</p>
      <p className="mt-3 font-display text-3xl font-bold text-slate-100">{value}</p>
    </motion.div>
  );
}

function ChartShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-slate-800 bg-slate-900/95 p-5 shadow-[0_16px_38px_rgba(2,6,23,0.55)]"
    >
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">{title}</h3>
      {children}
    </motion.div>
  );
}

function KpiSkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Skeleton className="h-28 rounded-2xl bg-slate-800" />
      <Skeleton className="h-28 rounded-2xl bg-slate-800" />
      <Skeleton className="h-28 rounded-2xl bg-slate-800" />
      <Skeleton className="h-28 rounded-2xl bg-slate-800" />
    </div>
  );
}

function ChartSkeletonGrid() {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Skeleton className="h-80 rounded-2xl bg-slate-800" />
      <Skeleton className="h-80 rounded-2xl bg-slate-800" />
      <Skeleton className="h-80 rounded-2xl bg-slate-800" />
    </div>
  );
}

export function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse>(emptyAnalytics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const complaintsOverTime = Array.isArray(analytics.complaintsOverTime) ? analytics.complaintsOverTime : [];
  const complaintsByCategory = Array.isArray(analytics.complaintsByCategory) ? analytics.complaintsByCategory : [];
  const complaintsByStatus = Array.isArray(analytics.complaintsByStatus) ? analytics.complaintsByStatus : [];

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = (await adminService.getAnalytics()) as unknown;
      const data = (response && typeof response === 'object' ? response : {}) as Partial<AdminAnalyticsResponse>;

      setAnalytics({
        totalComplaints: toNumber(data.totalComplaints),
        openComplaints: toNumber(data.openComplaints),
        resolvedComplaints: toNumber(data.resolvedComplaints),
        anonymousComplaints: toNumber(data.anonymousComplaints),
        complaintsByCategory: ensureAnalyticsArray(data.complaintsByCategory),
        complaintsByStatus: ensureAnalyticsArray(data.complaintsByStatus),
        complaintsOverTime: ensureAnalyticsArray(data.complaintsOverTime)
      });
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, []);

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-400">Analytics</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-100">Admin Analytics Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">Live operational metrics from /api/admin/analytics.</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadAnalytics()}
          disabled={loading}
          className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      {loading ? (
        <KpiSkeletonGrid />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Total Complaints" value={analytics.totalComplaints} />
          <KpiCard title="Open Complaints" value={analytics.openComplaints} />
          <KpiCard title="Resolved Complaints" value={analytics.resolvedComplaints} />
          <KpiCard title="Anonymous Complaints" value={analytics.anonymousComplaints} />
        </div>
      )}

      {loading ? (
        <ChartSkeletonGrid />
      ) : (
        <div className="grid gap-5 xl:grid-cols-3">
          <ChartShell title="Complaints Over Time">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={complaintsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 12 }}
                    labelStyle={{ color: '#cbd5e1' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartShell>

          <ChartShell title="Complaints By Category">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={complaintsByCategory} dataKey="count" nameKey="label" outerRadius={92} innerRadius={52}>
                    {complaintsByCategory.map((entry, index) => (
                      <Cell key={`${entry.label}-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 12 }}
                    labelStyle={{ color: '#cbd5e1' }}
                  />
                  <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartShell>

          <ChartShell title="Complaints By Status">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complaintsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 12 }}
                    labelStyle={{ color: '#cbd5e1' }}
                  />
                  <Bar dataKey="count" fill="#22c55e" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartShell>
        </div>
      )}
    </div>
  );
}