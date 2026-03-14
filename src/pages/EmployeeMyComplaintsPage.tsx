import { MessageSquarePlus, Paperclip } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEmployeeComplaints } from '@/hooks/useEmployeeComplaints';
import { complaintsApi } from '@/services/api';
import { formatDate, formatStatus } from '@/utils/formatters';

export function EmployeeMyComplaintsPage() {
  const { complaints, loading, reload } = useEmployeeComplaints();
  const [comment, setComment] = useState('');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  const selected = complaints.find((item) => item.trackingId === selectedComplaintId) ?? null;

  const uploadEvidence = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!selected || !event.target.files?.length) {
      return;
    }

    try {
      await complaintsApi.uploadAdditionalEvidence(selected.trackingId, Array.from(event.target.files));
      toast.success('Evidence uploaded.');
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Evidence upload failed.');
    }
  };

  const submitComment = async () => {
    if (!selected || !comment.trim()) {
      return;
    }

    try {
      await complaintsApi.addComment(selected.trackingId, comment.trim());
      toast.success('Comment posted.');
      setComment('');
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to post comment.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-primary">My Complaints</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Track and Collaborate</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Complaint list</h2>
          </div>

          {loading ? (
            <div className="p-5 text-sm text-muted-foreground">Loading complaints…</div>
          ) : complaints.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">No complaints submitted yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {complaints.map((complaint) => (
                <button
                  key={complaint.trackingId}
                  type="button"
                  onClick={() => setSelectedComplaintId(complaint.trackingId)}
                  className="w-full px-5 py-4 text-left transition hover:bg-muted/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{complaint.title}</p>
                    <Badge>{formatStatus(complaint.status)}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{complaint.trackingId}</span>
                    <span>{formatDate(complaint.createdAt)}</span>
                    <span>{complaint.category}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Complaint Detail</h2>

          {selected ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-lg font-semibold">{selected.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{selected.description || 'No description provided.'}</p>
              </div>

              <div className="rounded-xl bg-muted/40 p-3 text-sm">
                <p><span className="text-muted-foreground">Tracking ID:</span> {selected.trackingId}</p>
                <p><span className="text-muted-foreground">Status:</span> {formatStatus(selected.status)}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee-evidence" className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Upload additional evidence
                </Label>
                <Input id="employee-evidence" type="file" multiple onChange={uploadEvidence} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee-comment" className="flex items-center gap-2">
                  <MessageSquarePlus className="h-4 w-4" />
                  Add comment
                </Label>
                <Textarea
                  id="employee-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Share follow-up details for investigators..."
                />
                <Button className="w-full" onClick={() => void submitComment()}>Post comment</Button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Select a complaint to upload evidence or comment.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
