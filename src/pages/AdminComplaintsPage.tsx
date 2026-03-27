import { motion } from 'framer-motion';
import { RefreshCcw, SearchX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyStateIllustration } from '@/components/EmptyStateIllustration';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardOutletContext } from '@/layouts/DashboardLayout';
import { useAdminComplaints } from '@/hooks/useAdminComplaints';
import { apiClient as api } from '@/services/httpClient';
import type { Complaint, ComplaintPriority, ManagedComplaintStatus } from '@/types/complaint';
import { formatDate, formatStatus } from '@/utils/formatters';

const statusOptions: Array<'SUBMITTED' | ManagedComplaintStatus> = ['SUBMITTED', 'UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'REJECTED'];
const complaintFilters = ['ALL', 'SUBMITTED', ...statusOptions] as const;

type ComplaintFilter = (typeof complaintFilters)[number];
type SortField = 'createdAt' | 'title' | 'status' | 'priority';
type SortDirection = 'asc' | 'desc';

const PRIORITY_OPTIONS = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const PAGE_SIZE = 10;

function priorityVariant(priority?: ComplaintPriority) {
  if (priority === 'CRITICAL') return 'destructive';
  if (priority === 'HIGH') return 'warning';
  if (priority === 'MEDIUM') return 'secondary';
  return 'secondary';
}

export function AdminComplaintsPage() {
  const navigate = useNavigate();
  const { adminSearchQuery, setAdminSearchQuery, refreshAllAdminData, adminDataRefreshing } = useOutletContext<DashboardOutletContext>();
  const { complaints, loading, reload } = useAdminComplaints();
  const [statusFilter, setStatusFilter] = useState<ComplaintFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState<(typeof PRIORITY_OPTIONS)[number]>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [statusMap, setStatusMap] = useState<Record<string, Complaint['status']>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [statusUpdatedAlert, setStatusUpdatedAlert] = useState<string | null>(null);

  const safeComplaints = useMemo(() => (Array.isArray(complaints) ? complaints.map((complaint) => ({ ...complaint })) : []), [complaints]);

  useEffect(() => {
    setStatusMap(
      safeComplaints.reduce<Record<string, Complaint['status']>>((accumulator, complaint) => {
        const key = String(complaint.id ?? complaint.trackingId);
        accumulator[key] = complaint.status || 'SUBMITTED';
        return accumulator;
      }, {})
    );
  }, [safeComplaints]);

  const updateStatus = async (id: string, status: Complaint['status']) => {
    try {
      await api.put(`/api/admin/complaints/${encodeURIComponent(id)}/status`, {
        status
      });

      toast.success('Status updated successfully');
      await reload({ silent: true });
      setStatusUpdatedAlert(`Status updated for ${id}`);
      window.setTimeout(() => setStatusUpdatedAlert(null), 3500);
    } catch (err) {
      console.error(err);
      toast.error('Update failed');
    }
  };

  const categoryOptions = useMemo(
    () => Array.from(new Set(safeComplaints.map((complaint) => complaint.category))).sort((left, right) => left.localeCompare(right)),
    [safeComplaints]
  );

  const filteredComplaints = useMemo(() => {
    const searchValue = adminSearchQuery.trim().toLowerCase();
    const startBoundary = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const endBoundary = toDate ? new Date(`${toDate}T23:59:59.999`) : null;

    return safeComplaints.filter((complaint) => {
      const complaintDate = new Date(complaint.createdAt);
      const matchesSearch =
        !searchValue ||
        [complaint.trackingId, complaint.title, complaint.category, complaint.status, complaint.description ?? '']
          .join(' ')
          .toLowerCase()
          .includes(searchValue);
      const matchesStatus = statusFilter === 'ALL' || complaint.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || complaint.category === categoryFilter;
      const matchesPriority = priorityFilter === 'ALL' || (complaint.priority ?? 'LOW') === priorityFilter;
      const matchesStart = !startBoundary || complaintDate >= startBoundary;
      const matchesEnd = !endBoundary || complaintDate <= endBoundary;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority && matchesStart && matchesEnd;
    });
  }, [adminSearchQuery, categoryFilter, safeComplaints, statusFilter, priorityFilter, fromDate, toDate]);

  const sortedComplaints = useMemo(() => {
    const data = [...filteredComplaints];
    data.sort((left, right) => {
      const direction = sortDirection === 'asc' ? 1 : -1;

      if (sortField === 'createdAt') {
        return (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()) * direction;
      }

      if (sortField === 'title') {
        return left.title.localeCompare(right.title) * direction;
      }

      if (sortField === 'status') {
        return String(left.status).localeCompare(String(right.status)) * direction;
      }

      const order = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 } as Record<string, number>;
      const leftPriority = order[String(left.priority ?? 'LOW')] ?? 1;
      const rightPriority = order[String(right.priority ?? 'LOW')] ?? 1;
      return (leftPriority - rightPriority) * direction;
    });
    return data;
  }, [filteredComplaints, sortDirection, sortField]);

  const totalPages = Math.max(1, Math.ceil(sortedComplaints.length / PAGE_SIZE));
  const paginatedComplaints = useMemo(
    () => sortedComplaints.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, sortedComplaints]
  );

  const activeCount = filteredComplaints.filter(
    (complaint) => complaint.status === 'SUBMITTED' || complaint.status === 'UNDER_REVIEW'
  ).length;

  const clearFilters = () => {
    setAdminSearchQuery('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setPriorityFilter('ALL');
    setFromDate('');
    setToDate('');
    setSortField('createdAt');
    setSortDirection('desc');
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [adminSearchQuery, statusFilter, categoryFilter, priorityFilter, fromDate, toDate, sortField, sortDirection]);

  return (
    <div className="space-y-8">
      {statusUpdatedAlert && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
          {statusUpdatedAlert}
        </motion.div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Complaints</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">Complaints Workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage every complaint in one place, with shared search from the top navbar and inline status actions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground">
            {sortedComplaints.length} visible · {activeCount} active
          </div>
          <Button variant="outline" size="sm" onClick={() => void refreshAllAdminData()} disabled={loading || adminDataRefreshing}>
            <RefreshCcw className={adminDataRefreshing ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
            {adminDataRefreshing ? 'Refreshing...' : 'Reload'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
          <select
            aria-label="Filter complaint list by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ComplaintFilter)}
            className="flex h-12 w-full rounded-2xl border border-border/70 bg-background px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
          >
            {complaintFilters.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL' ? 'All statuses' : formatStatus(status)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
          <select
            aria-label="Filter complaint list by category"
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
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</label>
          <select
            aria-label="Filter complaint list by priority"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as (typeof PRIORITY_OPTIONS)[number])}
            className="flex h-12 w-full rounded-2xl border border-border/70 bg-background px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
          >
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {priority === 'ALL' ? 'All priorities' : priority}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              title="Filter complaints from date"
              className="flex h-12 w-full rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              title="Filter complaints to date"
              className="flex h-12 w-full rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div className="flex items-end">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <SearchX className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <div className="w-full">
        <div className="w-full rounded-xl border border-border bg-card shadow-lg p-5">
          <div className="border-b border-border px-4 pb-4">
            <h2 className="font-semibold text-card-foreground">Complaint Queue</h2>
            <p className="mt-1 text-xs text-muted-foreground">Use the shared navbar search plus queue filters to narrow complaints quickly.</p>
          </div>

          {loading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredComplaints.length === 0 ? (
            <EmptyStateIllustration
              title="No complaints found"
              description="Try adjusting your search and filters to find matching complaints."
            />
          ) : (
            <div className="overflow-x-auto mt-3">
              <table className="w-full table-auto text-sm">
                  <thead className="sticky top-0 z-20 shadow-sm">
                    <tr className="border-b border-border bg-muted/90 backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tracking ID</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Category</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reporter</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden xl:table-cell">Filed</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedComplaints.map((complaint) => (
                    <tr
                      key={complaint.trackingId}
                      onClick={() => setSelectedRowId(complaint.trackingId)}
                      className={`cursor-pointer transition-all ${
                        selectedRowId === complaint.trackingId
                          ? 'bg-primary/10 ring-1 ring-inset ring-primary/30'
                          : 'hover:bg-muted/40'
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-foreground">{complaint.trackingId}</td>
                      <td className="whitespace-nowrap px-4 py-3 max-w-[320px]">
                        <p className="truncate font-medium text-foreground">{complaint.title}</p>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground md:table-cell">{complaint.category}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge variant={priorityVariant(complaint.priority)} className="text-[10px]">
                          {complaint.priority ?? 'LOW'}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge variant={complaint.anonymous ? 'warning' : 'secondary'} className="text-[10px]">
                          {complaint.anonymous ? 'Anonymous' : 'Identified'}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <select
                          aria-label={`Select next status for ${complaint.trackingId}`}
                          value={statusMap[String(complaint.id ?? complaint.trackingId)] || complaint.status}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            setStatusMap((current) => ({
                              ...current,
                              [String(complaint.id ?? complaint.trackingId)]: event.target.value as Complaint['status']
                            }))
                          }
                          className="h-9 min-w-[150px] rounded-lg border border-border bg-background px-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring transition"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {formatStatus(status)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-muted-foreground xl:table-cell">{formatDate(complaint.createdAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/admin/complaints/${complaint.id || complaint.trackingId}`);
                            }}
                          >
                            View
                          </button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            disabled={savingId === complaint.trackingId}
                            onClick={(event) => {
                              event.stopPropagation();
                              void (async () => {
                                const complaintId = complaint.id ?? complaint.trackingId;
                                setSavingId(complaint.trackingId);
                                const key = String(complaintId);
                                const next = statusMap[key] || complaint.status;

                                await updateStatus(key, next);
                                setSavingId(null);
                              })();
                            }}
                          >
                            {savingId === complaint.trackingId ? 'Saving…' : 'Save'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <select
                    aria-label="Sort field"
                    value={sortField}
                    onChange={(event) => setSortField(event.target.value as SortField)}
                    className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
                  >
                    <option value="createdAt">Sort: Date</option>
                    <option value="title">Sort: Title</option>
                    <option value="status">Sort: Status</option>
                    <option value="priority">Sort: Priority</option>
                  </select>
                  <select
                    aria-label="Sort direction"
                    value={sortDirection}
                    onChange={(event) => setSortDirection(event.target.value as SortDirection)}
                    className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
                  >
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                  </select>
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Prev</Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
