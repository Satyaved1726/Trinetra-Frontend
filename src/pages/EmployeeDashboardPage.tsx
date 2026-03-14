import { MessageCircle, ShieldCheck, UploadCloud } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { ComplaintStatusTimeline } from '@/components/ComplaintStatusTimeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEmployeeComplaints } from '@/hooks/useEmployeeComplaints';
import { formatDate } from '@/utils/formatters';

export function EmployeeDashboardPage() {
  const { complaints, loading } = useEmployeeComplaints();
  const myRecent = useMemo(() => complaints.slice(0, 3), [complaints]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Employee Dashboard</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Your Complaint Workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">Submit complaints, track status, upload evidence, and post follow-up comments.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-sm text-muted-foreground">Total tracked complaints</p>
          <p className="mt-1 text-3xl font-display font-bold">{complaints.length}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <UploadCloud className="h-5 w-5" />
          </div>
          <p className="text-sm text-muted-foreground">Open complaints</p>
          <p className="mt-1 text-3xl font-display font-bold">
            {complaints.filter((item) => item.status !== 'RESOLVED' && item.status !== 'REJECTED').length}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <MessageCircle className="h-5 w-5" />
          </div>
          <p className="text-sm text-muted-foreground">Resolved complaints</p>
          <p className="mt-1 text-3xl font-display font-bold">{complaints.filter((item) => item.status === 'RESOLVED').length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Latest updates</h2>

        {loading ? (
          <div className="mt-4 text-sm text-muted-foreground">Loading complaint updates…</div>
        ) : myRecent.length === 0 ? (
          <div className="mt-4 text-sm text-muted-foreground">No complaints found yet.</div>
        ) : (
          <div className="mt-4 space-y-4">
            {myRecent.map((complaint) => (
              <div key={complaint.trackingId} className="rounded-xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{complaint.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(complaint.createdAt)}</p>
                  </div>
                  <Badge>{complaint.status}</Badge>
                </div>
                <div className="mt-3">
                  <ComplaintStatusTimeline status={complaint.status} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5">
          <Button asChild variant="outline">
            <Link to="/employee/my-complaints">View all complaints</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
