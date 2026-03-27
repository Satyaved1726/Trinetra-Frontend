import { motion } from 'framer-motion';
import { AlertCircle, Calendar, ChevronLeft, ChevronRight, Download, Filter, RefreshCcw, Search, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyStateIllustration } from '@/components/EmptyStateIllustration';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { adminQueryKeys } from '@/hooks/useAdminDashboardData';
import type { DashboardOutletContext } from '@/layouts/DashboardLayout';
import { API_URL } from '@/services/httpClient';
import { adminService, type ReportQuery } from '@/services/adminService';
import { toApiError } from '@/services/httpClient';
import { formatDate, formatStatus, buildComplaintStats } from '@/utils/formatters';
import type { Complaint } from '@/types/complaint';

const ITEMS_PER_PAGE = 10;
const CATEGORIES = ['HR', 'Finance', 'Operations', 'IT', 'Compliance', 'Other'];
const STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'REJECTED'];

interface FilterState {
  fromDate: string;
  toDate: string;
  category: string;
  status: string;
  search: string;
}

function MetricCard({ title, value, suffix = '', icon: Icon, gradient = 'from-blue-500/20 to-cyan-500/20', delay = 0 }: {
  title: string;
  value: string | number;
  suffix?: string;
  icon: React.ComponentType<{ className: string }>;
  gradient?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={`group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br ${gradient} p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-slate-600 hover:shadow-xl`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400 group-hover:text-slate-300 transition-colors">{title}</p>
          <p className="mt-3 font-display text-3xl font-bold text-slate-100">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span className="text-lg text-slate-400 ml-1">{suffix}</span>}
          </p>
        </div>
        <Icon className="h-6 w-6 text-slate-400 group-hover:text-slate-300 transition-colors opacity-60" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
}

function ChartCard({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 shadow-lg backdrop-blur-sm"
    >
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 opacity-60" />
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

export function AdminReportsPage() {
  const { refreshAllAdminData, adminDataRefreshing } = useOutletContext<DashboardOutletContext>();
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState<FilterState>({
    fromDate: '',
    toDate: '',
    category: '',
    status: '',
    search: ''
  });

  const [appliedFilters, setAppliedFilters] = useState<Omit<FilterState, 'search'>>({
    fromDate: '',
    toDate: '',
    category: '',
    status: ''
  });

  const reportQuery: ReportQuery = {
    from: appliedFilters.fromDate || undefined,
    to: appliedFilters.toDate || undefined,
    category: appliedFilters.category || undefined,
    status: appliedFilters.status || undefined
  };

  const reportsQuery = useQuery({
    queryKey: [
      ...adminQueryKeys.reports,
      reportQuery.from ?? '',
      reportQuery.to ?? '',
      reportQuery.category ?? '',
      reportQuery.status ?? ''
    ],
    queryFn: () => adminService.getReports(reportQuery),
    retry: 1,
    staleTime: 5 * 60 * 1000
  });

  const complaints: Complaint[] = reportsQuery.data ?? [];
  const loading = reportsQuery.isLoading;
  const error = reportsQuery.error instanceof Error ? reportsQuery.error.message : null;

  useEffect(() => {
    if (error) {
      toast.error('Failed to load reports', { description: error });
    }
  }, [error]);

  const applyFilters = () => {
    setAppliedFilters({
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      category: filters.category,
      status: filters.status
    });
    setCurrentPage(1);
  };

  // Calculate metrics
  const stats = useMemo(() => {
    const filtered = complaints.filter(c =>
      (filters.search === '' || c.title.toLowerCase().includes(filters.search.toLowerCase()) || c.trackingId.includes(filters.search))
    );

    const resolved = filtered.filter(c => c.status === 'RESOLVED').length;
    const rejected = filtered.filter(c => c.status === 'REJECTED').length;
    const closed = resolved + rejected;
    const resolutionRate = filtered.length > 0 ? Math.round((closed / filtered.length) * 100) : 0;

    // Calculate average resolution time (mock - in real scenario would come from API)
    const avgTime = filtered.length > 0
      ? filtered
          .filter(c => c.status === 'RESOLVED' || c.status === 'REJECTED')
          .reduce((sum, c) => {
            const created = new Date(c.createdAt).getTime();
            const resolved = new Date().getTime();
            return sum + (resolved - created);
          }, 0) / Math.max(closed, 1) / (1000 * 60 * 60 * 24)
      : 0;

    return {
      total: filtered.length,
      resolutionRate,
      avgResolutionTime: Math.round(avgTime)
    };
  }, [complaints, filters.search]);

  // Prepare chart data
  const trendData = useMemo(() => {
    const grouped: Record<string, number> = {};

    complaints.forEach(c => {
      const date = new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      grouped[date] = (grouped[date] ?? 0) + 1;
    });

    return Object.entries(grouped).map(([label, count]) => ({ label, count })).slice(0, 30);
  }, [complaints]);

  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};

    complaints.forEach(c => {
      grouped[c.category] = (grouped[c.category] ?? 0) + 1;
    });

    return Object.entries(grouped).map(([label, count]) => ({ label, count }));
  }, [complaints]);

  // Filter and paginate
  const filteredComplaints = useMemo(() => {
    return complaints.filter(c =>
      (filters.search === '' || c.title.toLowerCase().includes(filters.search.toLowerCase()) || c.trackingId.includes(filters.search))
    );
  }, [complaints, filters.search]);

  const totalPages = Math.ceil(filteredComplaints.length / ITEMS_PER_PAGE);
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      window.open(`${API_URL}/api/admin/reports/export/csv`, '_blank', 'noopener,noreferrer');
      toast.success('CSV exported successfully');
    } catch (err) {
      const apiError = toApiError(err);
      toast.error('Failed to export CSV', { description: apiError.message });
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      window.open(`${API_URL}/api/admin/reports/export/pdf`, '_blank', 'noopener,noreferrer');
      toast.success('PDF exported successfully');
    } catch (err) {
      const apiError = toApiError(err);
      toast.error('Failed to export PDF', { description: apiError.message });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400">Reports</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-100">Reports Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">Comprehensive complaint analysis and metrics</p>
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
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading || adminDataRefreshing ? 'animate-spin' : ''}`} />
            {loading || adminDataRefreshing ? 'Loading...' : 'Refresh'}
          </Button>
        </motion.div>
      </motion.div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6 backdrop-blur-sm"
      >
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">Filters</h3>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">From Date</label>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="bg-slate-700/50 border-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">To Date</label>
            <Input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="bg-slate-700/50 border-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Category</label>
            <select
              aria-label="Filter by category"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full rounded-lg bg-slate-700/50 border border-slate-600 px-3 py-2 text-sm text-slate-200"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Status</label>
            <select
              aria-label="Filter by status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full rounded-lg bg-slate-700/50 border border-slate-600 px-3 py-2 text-sm text-slate-200"
            >
              <option value="">All Status</option>
              {STATUSES.map(st => (
                <option key={st} value={st}>{formatStatus(st)}</option>
              ))}
            </select>
          </div>

          <Button
            onClick={applyFilters}
            disabled={loading}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white self-end"
          >
            <Search className="mr-2 h-4 w-4" />
            Apply
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by title or tracking ID..."
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              setCurrentPage(1);
            }}
            className="pl-10 bg-slate-700/50 border-slate-600"
          />
        </div>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-sm px-5 py-4 text-sm text-red-200"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </motion.div>
      )}

      {/* Metrics Cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-32 rounded-2xl bg-slate-800/50" />
          <Skeleton className="h-32 rounded-2xl bg-slate-800/50" />
          <Skeleton className="h-32 rounded-2xl bg-slate-800/50" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            title="Total Complaints"
            value={stats.total}
            icon={TrendingUp}
            gradient="from-blue-500/20 to-cyan-500/20"
            delay={0}
          />
          <MetricCard
            title="Resolution Rate"
            value={stats.resolutionRate}
            suffix="%"
            icon={() => <div className="h-6 w-6 text-green-400">%</div>}
            gradient="from-green-500/20 to-emerald-500/20"
            delay={0.1}
          />
          <MetricCard
            title="Avg Resolution"
            value={stats.avgResolutionTime}
            suffix="days"
            icon={() => <Calendar className="h-6 w-6" />}
            gradient="from-purple-500/20 to-pink-500/20"
            delay={0.2}
          />
        </div>
      )}

      {/* Charts */}
      {!loading && complaints.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCard title="Complaints Trend" delay={0.3}>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: 12
                    }}
                    labelStyle={{ color: '#cbd5e1' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#38bdf8' }}
                    isAnimationActive
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="By Category" delay={0.4}>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: 12
                    }}
                    labelStyle={{ color: '#cbd5e1' }}
                  />
                  <Bar dataKey="count" fill="#22c55e" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      )}

      {/* Export Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="flex gap-3"
      >
        <Button
          onClick={handleExportCSV}
          disabled={exporting || filteredComplaints.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button
          onClick={handleExportPDF}
          disabled={exporting || filteredComplaints.length === 0}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="rounded-2xl border border-slate-700/50 bg-slate-800/30 overflow-hidden shadow-lg backdrop-blur-sm"
      >
        <div className="overflow-x-auto">
          {paginatedComplaints.length === 0 ? (
            <EmptyStateIllustration
              title="No complaints found"
              description="Try broadening filters or updating the date range to view report entries."
            />
          ) : (
            <Table>
              <TableHeader className="bg-slate-900/50 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Tracking ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedComplaints.map((complaint) => (
                  <motion.tr
                    key={complaint.id || complaint.trackingId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                  >
                    <TableCell className="font-mono text-xs text-cyan-400">{complaint.trackingId}</TableCell>
                    <TableCell className="max-w-xs truncate">{complaint.title}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300">
                        {complaint.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          complaint.status === 'RESOLVED'
                            ? 'bg-green-500/20 text-green-300'
                            : complaint.status === 'REJECTED'
                              ? 'bg-red-500/20 text-red-300'
                              : complaint.status === 'INVESTIGATING'
                                ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                        }`}
                      >
                        {formatStatus(complaint.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">{formatDate(complaint.createdAt)}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${complaint.anonymous ? 'text-slate-400' : 'text-slate-500'}`}>
                        {complaint.anonymous ? 'Anonymous' : 'Named'}
                      </span>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-700/30 bg-slate-900/20 px-6 py-4">
            <p className="text-sm text-slate-400">
              Showing <span className="font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredComplaints.length)}</span> of{' '}
              <span className="font-semibold">{filteredComplaints.length}</span> results
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="border-slate-600 hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={page === currentPage ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-slate-600'}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="border-slate-600 hover:bg-slate-700"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}