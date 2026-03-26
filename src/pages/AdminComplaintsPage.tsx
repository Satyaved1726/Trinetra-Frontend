import { motion } from 'framer-motion';
import { Eye, FileStack, RefreshCcw, SearchX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardOutletContext } from '@/layouts/DashboardLayout';
import { useAdminComplaints } from '@/hooks/useAdminComplaints';
import type { Complaint, ManagedComplaintStatus } from '@/types/complaint';
import { formatDate, formatStatus, nextManagedStatus } from '@/utils/formatters';

const statusOptions: ManagedComplaintStatus[] = ['UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'REJECTED'];
const complaintFilters = ['ALL', 'SUBMITTED', ...statusOptions] as const;

type ComplaintFilter = (typeof complaintFilters)[number];

type ApiEvidenceFile = {
  id?: string;
  fileUrl: string;
  fileType?: string;
};

type ExtendedComplaint = Complaint & {
  evidenceFiles?: ApiEvidenceFile[];
};

type EvidenceFileItem = {
  id: string;
  url: string;
  type?: string;
  name?: string;
};

function inferEvidenceType(fileUrl: string, fileType?: string) {
  const value = (fileType ?? fileUrl).toLowerCase();
  if (value.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileUrl)) return 'image';
  if (value.startsWith('video/') || /\.(mp4|webm|ogg|mov|m4v)$/i.test(fileUrl)) return 'video';
  if (value.includes('pdf') || /\.pdf$/i.test(fileUrl)) return 'pdf';
  return 'other';
}

function toEvidenceFiles(complaint: ExtendedComplaint): EvidenceFileItem[] {
  const files = complaint.evidenceFiles;
  if (Array.isArray(files) && files.length > 0) {
    return files
      .filter((item) => typeof item?.fileUrl === 'string' && item.fileUrl.length > 0)
      .map((item, index) => ({
        id: item.id ?? `${item.fileUrl}-${index}`,
        url: item.fileUrl,
        type: item.fileType
      }));
  }

  if (Array.isArray(complaint.evidence) && complaint.evidence.length > 0) {
    return complaint.evidence
      .filter((item) => typeof item?.url === 'string' && item.url.length > 0)
      .map((item, index) => ({
        id: item.id ?? `${item.url}-${index}`,
        url: item.url,
        type: item.mimeType,
        name: item.name
      }));
  }

  if (complaint.evidenceUrl) {
    return [{ id: complaint.evidenceUrl, url: complaint.evidenceUrl }];
  }

  return [];
}

function ComplaintEvidenceSection({
  complaint,
  loading
}: {
  complaint: ExtendedComplaint;
  loading: boolean;
}) {
  const evidenceFiles = useMemo(() => toEvidenceFiles(complaint), [complaint]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [mediaLoading, setMediaLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    console.log('Evidence:', complaint?.evidenceFiles);
  }, [complaint]);

  useEffect(() => {
    const nextLoading: Record<string, boolean> = {};
    evidenceFiles.forEach((file) => {
      const type = inferEvidenceType(file.url, file.type);
      nextLoading[file.url] = type !== 'other';
    });
    setMediaLoading(nextLoading);
  }, [evidenceFiles]);

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold mb-2">EVIDENCE</h3>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : evidenceFiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
          No evidence uploaded
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {evidenceFiles.map((file) => {
            const fileType = inferEvidenceType(file.url, file.type);
            const isLoading = mediaLoading[file.url];

            return (
              <div key={file.id} className="rounded-lg overflow-hidden border p-2">
                {fileType === 'image' ? (
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setPreviewImageUrl(file.url)}
                    aria-label="Preview evidence image"
                  >
                    {isLoading ? <Skeleton className="h-32 w-32 rounded-lg" /> : null}
                    <img
                      src={file.url}
                      alt={file.name ?? 'Evidence image'}
                      className={`h-32 w-full object-cover transition-transform duration-200 hover:scale-105 ${isLoading ? 'hidden' : ''}`}
                      onLoad={() => setMediaLoading((current) => ({ ...current, [file.url]: false }))}
                      onError={() => setMediaLoading((current) => ({ ...current, [file.url]: false }))}
                    />
                  </button>
                ) : null}

                {fileType === 'video' ? (
                  <>
                    {isLoading ? <Skeleton className="h-36 w-full rounded-lg" /> : null}
                    <video
                      controls
                      className={`w-full h-32 ${isLoading ? 'hidden' : ''}`}
                      onLoadedData={() => setMediaLoading((current) => ({ ...current, [file.url]: false }))}
                      onError={() => setMediaLoading((current) => ({ ...current, [file.url]: false }))}
                    >
                      <source src={file.url} />
                    </video>
                  </>
                ) : null}

                {fileType === 'pdf' ? (
                  <>
                    {isLoading ? <Skeleton className="h-64 w-full rounded-lg" /> : null}
                    <iframe
                      src={file.url}
                      title={file.name ?? 'Evidence PDF'}
                      className={`w-full h-40 ${isLoading ? 'hidden' : ''}`}
                      onLoad={() => setMediaLoading((current) => ({ ...current, [file.url]: false }))}
                    />
                  </>
                ) : null}

                {fileType === 'other' ? (
                  <Button asChild size="sm" variant="outline" className="w-full justify-start">
                    <a href={file.url} target="_blank" rel="noreferrer" className="text-blue-500 underline">
                      Download File
                    </a>
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {previewImageUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImageUrl(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-background/80 px-3 py-1 text-sm font-medium text-foreground"
            onClick={() => setPreviewImageUrl(null)}
          >
            Close
          </button>
          <img
            src={previewImageUrl}
            alt="Evidence preview"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </section>
  );
}

function statusVariant(status: string) {
  if (status === 'RESOLVED') return 'success';
  if (status === 'REJECTED') return 'destructive';
  if (status === 'UNDER_REVIEW') return 'warning';
  if (status === 'INVESTIGATING') return 'warning';
  return 'secondary';
}

export function AdminComplaintsPage() {
  const { adminSearchQuery, setAdminSearchQuery } = useOutletContext<DashboardOutletContext>();
  const { complaints, loading, reload, updateComplaintStatus, updatingId } = useAdminComplaints();
  const [statusFilter, setStatusFilter] = useState<ComplaintFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [draftStatuses, setDraftStatuses] = useState<Record<string, ManagedComplaintStatus>>({});
  const [selectedComplaint, setSelectedComplaint] = useState<ExtendedComplaint | null>(null);

  const safeComplaints = useMemo(() => {
    if (!Array.isArray(complaints)) {
      console.warn('Complaints is not an array:', complaints);
      return [];
    }

    return complaints.map((complaint) => ({ ...complaint }));
  }, [complaints]);

  useEffect(() => {
    setDraftStatuses(
      safeComplaints.reduce<Record<string, ManagedComplaintStatus>>((accumulator, complaint) => {
        accumulator[complaint.trackingId] = nextManagedStatus(complaint.status);
        return accumulator;
      }, {})
    );
  }, [safeComplaints]);

  const categoryOptions = useMemo(
    () => Array.from(new Set(safeComplaints.map((complaint) => complaint.category))).sort((left, right) => left.localeCompare(right)),
    [safeComplaints]
  );

  const filteredComplaints = useMemo(() => {
    const searchValue = adminSearchQuery.trim().toLowerCase();

    return safeComplaints.filter((complaint) => {
      const matchesSearch =
        !searchValue ||
        [complaint.trackingId, complaint.title, complaint.category, complaint.status, complaint.description ?? '']
          .join(' ')
          .toLowerCase()
          .includes(searchValue);
      const matchesStatus = statusFilter === 'ALL' || complaint.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || complaint.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [adminSearchQuery, categoryFilter, safeComplaints, statusFilter]);

  const activeCount = filteredComplaints.filter(
    (complaint) => complaint.status === 'SUBMITTED' || complaint.status === 'UNDER_REVIEW'
  ).length;

  const handleSelectComplaint = (complaint: ExtendedComplaint) => {
    console.log('Selected complaint:', complaint);
    setSelectedComplaint((current) => (current?.trackingId === complaint.trackingId ? null : complaint));
  };

  useEffect(() => {
    if (!selectedComplaint) return;
    const freshComplaint = safeComplaints.find((complaint) => complaint.trackingId === selectedComplaint.trackingId);
    if (freshComplaint) {
      setSelectedComplaint(freshComplaint as ExtendedComplaint);
    }
  }, [safeComplaints, selectedComplaint]);

  const clearFilters = () => {
    setAdminSearchQuery('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setSelectedComplaint(null);
  };

  return (
    <div className="space-y-8">
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
            {filteredComplaints.length} visible · {activeCount} active
          </div>
          <Button variant="outline" size="sm" onClick={() => void reload()} disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reload
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] rounded-2xl border border-border bg-card p-5 shadow-sm">
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
        <div className="flex items-end">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <SearchX className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-4">
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
            <div className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">No complaints match the current view.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tracking ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reporter</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden xl:table-cell">Filed</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredComplaints.map((complaint) => (
                    <tr key={complaint.trackingId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">{complaint.trackingId}</td>
                      <td className="px-4 py-3 max-w-[260px]">
                        <p className="truncate font-medium text-foreground">{complaint.title}</p>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{complaint.category}</td>
                      <td className="px-4 py-3">
                        <Badge variant={complaint.anonymous ? 'warning' : 'secondary'} className="text-[10px]">
                          {complaint.anonymous ? 'Anonymous' : 'Identified'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(complaint.status)} className="text-[10px]">
                          {formatStatus(complaint.status)}
                        </Badge>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-muted-foreground xl:table-cell">{formatDate(complaint.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleSelectComplaint(complaint as ExtendedComplaint)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <select
                            aria-label={`Select next status for ${complaint.trackingId}`}
                            value={draftStatuses[complaint.trackingId] ?? nextManagedStatus(complaint.status)}
                            onChange={(event) =>
                              setDraftStatuses((current) => ({
                                ...current,
                                [complaint.trackingId]: event.target.value as ManagedComplaintStatus
                              }))
                            }
                            className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring transition"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {formatStatus(status)}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            disabled={updatingId === complaint.trackingId}
                            onClick={() =>
                              void updateComplaintStatus(
                                complaint,
                                draftStatuses[complaint.trackingId] ?? nextManagedStatus(complaint.status)
                              )
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

        <motion.aside
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileStack className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Inspector</p>
              <h2 className="font-semibold text-foreground">Complaint detail</h2>
            </div>
          </div>

          {selectedComplaint ? (
            <div className="mt-6 space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{selectedComplaint.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{selectedComplaint.description || 'No description provided.'}</p>
              </div>

              <div className="grid gap-3 rounded-2xl bg-muted/40 p-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Tracking ID</p>
                  <p className="mt-1 font-mono font-semibold text-foreground">{selectedComplaint.trackingId}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Category</p>
                  <p className="mt-1 font-semibold text-foreground">{selectedComplaint.category}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Filed</p>
                  <p className="mt-1 font-semibold text-foreground">{formatDate(selectedComplaint.createdAt)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant={statusVariant(selectedComplaint.status)}>{formatStatus(selectedComplaint.status)}</Badge>
                <Badge variant={selectedComplaint.anonymous ? 'warning' : 'secondary'}>
                  {selectedComplaint.anonymous ? 'Anonymous' : 'Identified'}
                </Badge>
              </div>

              <ComplaintEvidenceSection complaint={selectedComplaint} loading={loading} />
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-10 text-center text-sm text-muted-foreground">
              Select a complaint from the queue to inspect its details.
            </div>
          )}
        </motion.aside>
      </div>
    </div>
  );
}
