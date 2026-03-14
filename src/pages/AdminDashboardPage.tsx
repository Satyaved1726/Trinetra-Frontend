import { motion } from 'framer-motion';
import {
  AlertCircle,
  CalendarRange,
  CheckCircle2,
  Eye,
  EyeOff,
  Filter,
  FolderKanban,
  RefreshCcw,
  SearchX,
  TrendingUp
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import { ComplaintCharts } from '@/components/ComplaintCharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminComplaints } from '@/hooks/useAdminComplaints';
import type { DashboardOutletContext } from '@/layouts/DashboardLayout';
import type { Complaint, ManagedComplaintStatus } from '@/types/complaint';
import { buildComplaintStats, formatDate, formatStatus, nextManagedStatus } from '@/utils/formatters';
import { cn } from '@/utils/cn';

const statusOptions: ManagedComplaintStatus[] = ['UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'REJECTED'];
const dashboardStatusFilters = ['ALL', 'SUBMITTED', ...statusOptions] as const;

type DashboardStatusFilter = (typeof dashboardStatusFilters)[number];

const statusBadgeVariant = (status: string) => {
  if (status === 'RESOLVED') return 'success';
  if (status === 'REJECTED') return 'destructive';
  if (status === 'UNDER_REVIEW') return 'warning';
  if (status === 'INVESTIGATING') return 'warning';
  return 'secondary';
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  color: string;
  iconBg: string;
}

function StatCard({ title, value, description, icon: Icon, color, iconBg }: StatCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
        <TrendingUp className="h-4 w-4 text-muted-foreground/40" />
      </div>
      <p className={cn('text-3xl font-display font-extrabold', color)}>{value}</p>
      <p className="text-sm font-medium text-card-foreground mt-1">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </motion.div>
  );
}

export function AdminDashboardPage() {
  const { adminSearchQuery, setAdminSearchQuery } = useOutletContext<DashboardOutletContext>();
  const { complaints, loading, reload, updateComplaintStatus, updatingId } = useAdminComplaints();
  const [draftStatuses, setDraftStatuses] = useState<Record<string, ManagedComplaintStatus>>({});
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DashboardStatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const categoryOptions = useMemo(
    () => Array.from(new Set(complaints.map((complaint) => complaint.category))).sort((left, right) => left.localeCompare(right)),
    [complaints]
  );

  const filteredComplaints = useMemo(() => {
    const searchValue = adminSearchQuery.trim().toLowerCase();
    const startBoundary = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const endBoundary = toDate ? new Date(`${toDate}T23:59:59.999`) : null;

    return complaints.filter((complaint) => {
      const complaintDate = new Date(complaint.createdAt);
      const matchesSearch =
        !searchValue ||
        [complaint.trackingId, complaint.title, complaint.category, complaint.status, complaint.description ?? '']
          .join(' ')
          .toLowerCase()
          .includes(searchValue);
      const matchesStatus = statusFilter === 'ALL' || complaint.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || complaint.category === categoryFilter;
      const matchesStart = !startBoundary || complaintDate >= startBoundary;
      const matchesEnd = !endBoundary || complaintDate <= endBoundary;

      return matchesSearch && matchesStatus && matchesCategory && matchesStart && matchesEnd;
    });
  }, [adminSearchQuery, categoryFilter, complaints, fromDate, statusFilter, toDate]);

  const stats = useMemo(() => buildComplaintStats(filteredComplaints), [filteredComplaints]);
  const hasActiveFilters = Boolean(
    adminSearchQuery.trim() || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || fromDate || toDate
  );

  useEffect(() => {
    setDraftStatuses(
      complaints.reduce<Record<string, ManagedComplaintStatus>>((accumulator, complaint) => {
        accumulator[complaint.trackingId] = nextManagedStatus(complaint.status);
        return accumulator;
      }, {})
    );
  }, [complaints]);

  const viewingComplaint = filteredComplaints.find((c) => c.trackingId === viewingId) ?? null;

  const clearFilters = () => {
    setAdminSearchQuery('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setFromDate('');
    setToDate('');
    setViewingId(null);
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Operations</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Complaint Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review, manage, and resolve complaints from a single workspace.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground">
            Showing {filteredComplaints.length} of {complaints.length}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => void reload()}
            className="self-start sm:self-auto"
          >
            <RefreshCcw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Filter className="h-4 w-4 text-primary" />
              Filters
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Search from the top bar and refine the charts and queue by status, category, and date range.
            </p>
          </div>
          {hasActiveFilters ? (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <SearchX className="h-4 w-4 mr-2" />
              Clear filters
            </Button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr_1fr_1fr]">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
            <select
              aria-label="Filter complaints by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as DashboardStatusFilter)}
              className="flex h-12 w-full rounded-2xl border border-border/70 bg-background px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
            >
              {dashboardStatusFilters.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All statuses' : formatStatus(status)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
            <select
              aria-label="Filter complaints by category"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="flex h-12 w-full rounded-2xl border border-border/70 bg-background px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
            >
              <option value="ALL">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarRange className="h-3.5 w-3.5" />
              From date
            </label>
            <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">To date</label>
            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          title="Total Complaints"
          value={stats.totalComplaints}
          description="All complaints loaded"
          icon={FolderKanban}
          color="text-blue-600"
          iconBg="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard
          title="Open Cases"
          value={stats.openComplaints}
          description="Submitted or under review"
          icon={AlertCircle}
          color="text-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-900/30"
        />
        <StatCard
          title="Resolved"
          value={stats.resolvedComplaints}
          description="Successfully closed cases"
          icon={CheckCircle2}
          color="text-emerald-600"
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
        />
        <StatCard
          title="Anonymous Reports"
          value={stats.anonymousComplaints}
          description="Filed without identity disclosure"
          icon={EyeOff}
          color="text-violet-600"
          iconBg="bg-violet-100 dark:bg-violet-900/30"
        />
      </motion.div>

      {/* Charts */}
      <ComplaintCharts complaints={filteredComplaints} stats={stats} />

      {/* Complaint table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-card-foreground">Complaint Queue</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Update statuses directly and keep the dashboard in sync with backend data.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center text-muted-foreground text-sm">
            {hasActiveFilters ? 'No complaints match the active filters.' : 'No complaints available yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tracking ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
                    Filed
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.trackingId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {complaint.trackingId}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="font-medium text-foreground truncate">{complaint.title}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {complaint.category}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadgeVariant(complaint.status)} className="text-xs">
                        {formatStatus(complaint.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                      {formatDate(complaint.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* View detail */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => setViewingId(
                            viewingId === complaint.trackingId ? null : complaint.trackingId
                          )}
                          aria-label={`View complaint ${complaint.trackingId}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Status select */}
                        <select
                          aria-label={`Update status for ${complaint.trackingId}`}
                          value={draftStatuses[complaint.trackingId] ?? nextManagedStatus(complaint.status)}
                          onChange={(e) =>
                            setDraftStatuses((prev) => ({
                              ...prev,
                              [complaint.trackingId]: e.target.value as ManagedComplaintStatus
                            }))
                          }
                          className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring transition"
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {formatStatus(s)}
                            </option>
                          ))}
                        </select>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          disabled={updatingId === complaint.trackingId}
                          onClick={() =>
                            void (async () => {
                              const nextStatus = draftStatuses[complaint.trackingId] ?? nextManagedStatus(complaint.status);
                              const confirmed = window.confirm(
                                `Update complaint ${complaint.trackingId} to "${formatStatus(nextStatus)}"?`
                              );
                              if (!confirmed) {
                                return;
                              }

                              const updated = await updateComplaintStatus(complaint, nextStatus);
                              setDraftStatuses((current) => ({
                                ...current,
                                [complaint.trackingId]: nextManagedStatus(updated.status)
                              }));
                            })()
                          }
                        >
                          {updatingId === complaint.trackingId ? 'Saving…' : 'Save'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inline complaint detail panel */}
      {viewingComplaint && (
        <motion.div
          key={viewingComplaint.trackingId}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Complaint Details</p>
              <h2 className="font-semibold text-lg text-foreground">{viewingComplaint.title}</h2>
            </div>
            <Badge variant={statusBadgeVariant(viewingComplaint.status)} className="shrink-0">
              {formatStatus(viewingComplaint.status)}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 bg-muted/40 rounded-xl p-4 mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Tracking ID</p>
              <p className="font-mono text-sm font-semibold text-foreground">{viewingComplaint.trackingId}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Category</p>
              <p className="text-sm font-semibold text-foreground">{viewingComplaint.category}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Filed</p>
              <p className="text-sm font-semibold text-foreground">{formatDate(viewingComplaint.createdAt)}</p>
            </div>
          </div>

          {viewingComplaint.description && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Description</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{viewingComplaint.description}</p>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="mt-4 text-muted-foreground"
            onClick={() => setViewingId(null)}
          >
            Close
          </Button>
        </motion.div>
      )}
    </div>
  );
}
