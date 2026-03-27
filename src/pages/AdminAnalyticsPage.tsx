import { motion } from 'framer-motion';
import { AlertCircle, RefreshCcw, TrendingUp, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
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
import { adminQueryKeys } from '@/hooks/useAdminDashboardData';
import type { DashboardOutletContext } from '@/layouts/DashboardLayout';
import { apiClient as api } from '@/services/httpClient';
import type { AdminAnalyticsResponse } from '@/services/adminService';
import type { Complaint } from '@/types/complaint';

const pieColors = ['#38bdf8', '#22c55e', '#f59e0b', '#f43f5e', '#a78bfa', '#14b8a6'];

const emptyAnalytics: AdminAnalyticsResponse = {
  totalComplaints: 0,
  openComplaints: 0,
  resolvedComplaints: 0,
  rejectedComplaints: 0,
  anonymousComplaints: 0,
  identifiedComplaints: 0,
  complaintsOverTime: [],
  complaintsByCategory: [],
  complaintsByStatus: []
};

function toCountMap(items: Complaint[], key: (item: Complaint) => string) {
  return items.reduce<Record<string, number>>((accumulator, item) => {
    const value = key(item) || 'Unknown';
    accumulator[value] = (accumulator[value] ?? 0) + 1;
    return accumulator;
  }, {});
}

function mapComplaintListToAnalytics(items: Complaint[]): AdminAnalyticsResponse {
  const totalComplaints = items.length;
  const resolvedComplaints = items.filter((item) => item.status === 'RESOLVED').length;
  const rejectedComplaints = items.filter((item) => item.status === 'REJECTED').length;
  const openComplaints = items.filter(
    (item) => item.status === 'UNDER_REVIEW' || item.status === 'INVESTIGATING'
  ).length;
  const anonymousComplaints = items.filter((item) => item.anonymous).length;
  const identifiedComplaints = totalComplaints - anonymousComplaints;

  const byCategory = toCountMap(items, (item) => item.category);
  const byStatus = toCountMap(items, (item) => item.status);
  const byDate = toCountMap(items, (item) => new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));

  return {
    totalComplaints,
    openComplaints,
    resolvedComplaints,
    rejectedComplaints,
    anonymousComplaints,
    identifiedComplaints,
    complaintsByCategory: Object.entries(byCategory).map(([label, count]) => ({ label, count })),
    complaintsByStatus: Object.entries(byStatus).map(([label, count]) => ({ label, count })),
    complaintsOverTime: Object.entries(byDate).map(([label, count]) => ({ label, count }))
  };
}

function mapBackendAnalyticsPayload(payload: unknown): AdminAnalyticsResponse {
  if (Array.isArray(payload)) {
    return mapComplaintListToAnalytics(payload as Complaint[]);
  }

  if (!payload || typeof payload !== 'object') {
    return emptyAnalytics;
  }

  const source = (payload as { data?: unknown }).data ?? payload;
  if (Array.isArray(source)) {
    return mapComplaintListToAnalytics(source as Complaint[]);
  }

  const record = source as Record<string, unknown>;
  return {
    totalComplaints: Number(record.totalComplaints ?? 0),
    openComplaints: Number(record.openComplaints ?? 0),
    resolvedComplaints: Number(record.resolvedComplaints ?? 0),
    rejectedComplaints: Number(record.rejectedComplaints ?? 0),
    anonymousComplaints: Number(record.anonymousComplaints ?? 0),
    identifiedComplaints: Number(record.identifiedComplaints ?? 0),
    complaintsOverTime: Array.isArray(record.complaintsOverTime) ? (record.complaintsOverTime as AdminAnalyticsResponse['complaintsOverTime']) : [],
    complaintsByCategory: Array.isArray(record.complaintsByCategory) ? (record.complaintsByCategory as AdminAnalyticsResponse['complaintsByCategory']) : [],
    complaintsByStatus: Array.isArray(record.complaintsByStatus) ? (record.complaintsByStatus as AdminAnalyticsResponse['complaintsByStatus']) : []
  };
}

interface KpiCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon?: React.ReactNode;
  gradient?: string;
  delay?: number;
}

function KpiCard({ title, value, subtitle, icon, gradient = 'from-blue-500/20 to-cyan-500/20', delay = 0 }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={`group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br ${gradient} p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-slate-600 hover:shadow-xl`}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500" />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400 group-hover:text-slate-300 transition-colors">{title}</p>
          <p className="mt-3 font-display text-4xl font-bold text-slate-100">{value.toLocaleString()}</p>
          {subtitle && <p className="mt-2 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {icon && <div className="ml-4 text-slate-400 group-hover:text-slate-300 transition-colors opacity-60">{icon}</div>}
      </div>

      {/* Bottom accent bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
}

function RatioCard({ title, primary, secondary, primaryLabel, secondaryLabel, delay = 0 }: {
  title: string;
  primary: number;
  secondary: number;
  primaryLabel: string;
  secondaryLabel: string;
  delay?: number;
}) {
  const total = primary + secondary;
  const primaryPercent = total > 0 ? Math.round((primary / total) * 100) : 0;
  const secondaryPercent = 100 - primaryPercent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-slate-600 hover:shadow-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500" />

      <div className="relative">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400 group-hover:text-slate-300 transition-colors">{title}</p>

        <div className="mt-6 space-y-4">
          {/* Primary Bar */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">{primaryLabel}</span>
              <span className="font-semibold text-cyan-400">{primary}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-700/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${primaryPercent}%` }}
                transition={{ duration: 0.6, delay: delay + 0.2 }}
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">{primaryPercent}%</p>
          </div>

          {/* Secondary Bar */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">{secondaryLabel}</span>
              <span className="font-semibold text-purple-400">{secondary}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-700/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${secondaryPercent}%` }}
                transition={{ duration: 0.6, delay: delay + 0.3 }}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">{secondaryPercent}%</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
}

function ChartShell({ title, children, delay = 0, hasData = true }: { title: string; children: React.ReactNode; delay?: number; hasData?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={hasData ? { y: -4 } : {}}
      className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-slate-600 hover:shadow-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-500" />

      <h3 className="relative mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 opacity-60" />
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

function ChartPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-72 bg-slate-800/30 rounded-lg">
      <AlertCircle className="h-8 w-8 text-slate-500 mb-3" />
      <p className="text-sm text-slate-400">No data available</p>
    </div>
  );
}

function KpiSkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Skeleton className="h-32 rounded-2xl bg-slate-800/50" />
      <Skeleton className="h-32 rounded-2xl bg-slate-800/50" />
      <Skeleton className="h-32 rounded-2xl bg-slate-800/50" />
      <Skeleton className="h-32 rounded-2xl bg-slate-800/50" />
    </div>
  );
}

function RatioSkeletonCard() {
  return <Skeleton className="h-56 rounded-2xl bg-slate-800/50" />;
}

function ChartSkeletonGrid() {
  return (
    <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
      <Skeleton className="h-80 rounded-2xl bg-slate-800/50" />
      <Skeleton className="h-80 rounded-2xl bg-slate-800/50" />
      <Skeleton className="h-80 rounded-2xl bg-slate-800/50" />
    </div>
  );
}

export function AdminAnalyticsPage() {
  const { refreshAllAdminData, adminDataRefreshing } = useOutletContext<DashboardOutletContext>();
  const analyticsQuery = useQuery({
    queryKey: adminQueryKeys.analytics,
    queryFn: async () => {
      const response = await api.get('/api/admin/analytics');
      const directPayload = ((response.data as { data?: unknown })?.data ?? response.data) as unknown;
      if (directPayload && typeof directPayload === 'object' && !Array.isArray(directPayload)) {
        const directRecord = directPayload as Partial<AdminAnalyticsResponse>;
        return {
          ...emptyAnalytics,
          ...directRecord,
          complaintsOverTime: Array.isArray(directRecord.complaintsOverTime) ? directRecord.complaintsOverTime : [],
          complaintsByCategory: Array.isArray(directRecord.complaintsByCategory) ? directRecord.complaintsByCategory : [],
          complaintsByStatus: Array.isArray(directRecord.complaintsByStatus) ? directRecord.complaintsByStatus : []
        };
      }

      return mapBackendAnalyticsPayload(response.data);
    },
    retry: 1,
    staleTime: 5 * 60 * 1000
  });

  const analytics: AdminAnalyticsResponse = analyticsQuery.data ?? emptyAnalytics;
  const loading = analyticsQuery.isLoading;
  const error = analyticsQuery.error instanceof Error ? analyticsQuery.error.message : null;

  const complaintsOverTime = Array.isArray(analytics.complaintsOverTime) ? analytics.complaintsOverTime : [];
  const complaintsByCategory = Array.isArray(analytics.complaintsByCategory) ? analytics.complaintsByCategory : [];
  const complaintsByStatus = Array.isArray(analytics.complaintsByStatus) ? analytics.complaintsByStatus : [];

  const hasChartData = complaintsOverTime.length > 0 || complaintsByCategory.length > 0 || complaintsByStatus.length > 0;
  const totalIdentified = analytics.identifiedComplaints ?? (analytics.totalComplaints - analytics.anonymousComplaints);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400"
          >
            Analytics Dashboard
          </motion.p>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-100"
          >
            Admin Analytics
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-2 text-sm text-slate-400"
          >
            Real-time operational metrics with cached smart refresh
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex gap-2"
        >
          <Button
            onClick={() => void refreshAllAdminData()}
            disabled={loading || adminDataRefreshing}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading || adminDataRefreshing ? 'animate-spin' : ''}`} />
            {loading || adminDataRefreshing ? 'Loading...' : 'Refresh Now'}
          </Button>
        </motion.div>
      </motion.div>

      {/* Error Alert */}
      {error ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-sm px-5 py-4 text-sm text-red-200"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">{error}</p>
            <p className="mt-1 text-xs text-red-300/80">Check your connection and try again</p>
          </div>
        </motion.div>
      ) : null}

      {/* KPI Cards - Main Metrics */}
      {loading ? (
        <KpiSkeletonGrid />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <KpiCard
            title="Total Complaints"
            value={analytics.totalComplaints}
            icon={<TrendingUp className="h-6 w-6" />}
            gradient="from-blue-500/20 to-cyan-500/20"
            delay={0}
          />
          <KpiCard
            title="Open"
            value={analytics.openComplaints}
            gradient="from-yellow-500/20 to-orange-500/20"
            delay={0.1}
          />
          <KpiCard
            title="Resolved"
            value={analytics.resolvedComplaints}
            gradient="from-green-500/20 to-emerald-500/20"
            delay={0.2}
          />
          <KpiCard
            title="Rejected"
            value={analytics.rejectedComplaints ?? 0}
            gradient="from-red-500/20 to-rose-500/20"
            delay={0.3}
          />
        </div>
      )}

      {/* Ratio Cards Section */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <RatioSkeletonCard />
          <RatioSkeletonCard />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <RatioCard
            title="Complaint Anonymity"
            primary={analytics.anonymousComplaints}
            secondary={totalIdentified}
            primaryLabel="Anonymous"
            secondaryLabel="Identified"
            delay={0.4}
          />

          <RatioCard
            title="Complaint Status Ratio"
            primary={analytics.openComplaints}
            secondary={analytics.resolvedComplaints + (analytics.rejectedComplaints ?? 0)}
            primaryLabel="Pending"
            secondaryLabel="Closed"
            delay={0.5}
          />
        </div>
      )}

      {/* Charts Section */}
      {loading ? (
        <ChartSkeletonGrid />
      ) : (
        <>
          {!hasChartData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-8 text-center"
            >
              <AlertCircle className="mx-auto h-10 w-10 text-slate-500 mb-3" />
              <p className="text-slate-400">No chart data available yet</p>
              <p className="mt-1 text-sm text-slate-500">Charts will appear once complaint data is recorded</p>
            </motion.div>
          )}

          {hasChartData && (
            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              <ChartShell
                title="Complaints Over Time"
                delay={0.6}
                hasData={complaintsOverTime.length > 0}
              >
                {complaintsOverTime.length > 0 ? (
                  <div className="w-full">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={complaintsOverTime}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#94a3b8" allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #475569',
                            borderRadius: 12,
                            boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                          }}
                          labelStyle={{ color: '#cbd5e1' }}
                          cursor={{ stroke: '#38bdf8', strokeWidth: 1 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#38bdf8"
                          strokeWidth={2.5}
                          dot={{ r: 5, fill: '#38bdf8' }}
                          activeDot={{ r: 7, fill: '#0ea5e9' }}
                          isAnimationActive
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <ChartPlaceholder />
                )}
              </ChartShell>

              <ChartShell
                title="Complaints By Category"
                delay={0.7}
                hasData={complaintsByCategory.length > 0}
              >
                {complaintsByCategory.length > 0 ? (
                  <div className="w-full">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={complaintsByCategory}
                          dataKey="count"
                          nameKey="label"
                          outerRadius={92}
                          innerRadius={52}
                          paddingAngle={2}
                        >
                          {complaintsByCategory.map((entry, index) => (
                            <Cell key={`${entry.label}-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #475569',
                            borderRadius: 12,
                            boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                          }}
                          labelStyle={{ color: '#cbd5e1' }}
                        />
                        <Legend
                          wrapperStyle={{ paddingTop: '16px' }}
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <ChartPlaceholder />
                )}
              </ChartShell>

              <ChartShell
                title="Complaints By Status"
                delay={0.8}
                hasData={complaintsByStatus.length > 0}
              >
                {complaintsByStatus.length > 0 ? (
                  <div className="w-full">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={complaintsByStatus}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#94a3b8" allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #475569',
                            borderRadius: 12,
                            boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                          }}
                          labelStyle={{ color: '#cbd5e1' }}
                          cursor={{ fill: 'rgba(56, 189, 248, 0.1)' }}
                        />
                        <Bar dataKey="count" fill="url(#barGradient)" radius={[12, 12, 0, 0]} isAnimationActive />
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <ChartPlaceholder />
                )}
              </ChartShell>
            </div>
          )}
        </>
      )}

    </div>
  );
}