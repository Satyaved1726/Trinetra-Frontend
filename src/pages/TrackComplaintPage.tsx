import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { ComplaintStatusTimeline } from '@/components/ComplaintStatusTimeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { complaintsApi } from '@/services/api';
import type { Complaint } from '@/types/complaint';
import { formatDate, formatStatus } from '@/utils/formatters';

const trackingSchema = z.object({
  trackingId: z.string().min(3, 'Enter a valid tracking ID.'),
  anonymousToken: z.string().optional()
});

type TrackingFormValues = z.infer<typeof trackingSchema>;

function statusVariant(status: string) {
  if (status === 'RESOLVED') return 'success';
  if (status === 'REJECTED') return 'destructive';
  if (status === 'UNDER_REVIEW') return 'warning';
  return 'secondary';
}

export function TrackComplaintPage() {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<TrackingFormValues>({
    resolver: zodResolver(trackingSchema),
    defaultValues: { trackingId: '', anonymousToken: '' }
  });

  const onSubmit = async ({ trackingId, anonymousToken }: TrackingFormValues) => {
    try {
      const response = await complaintsApi.trackComplaint(trackingId.trim(), anonymousToken?.trim() || undefined);
      setComplaint(response);
      toast.success('Complaint found.');
    } catch (error) {
      setComplaint(null);
      const message = error instanceof Error ? error.message : 'No complaint found for this tracking ID.';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Live Tracking</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
              Track Your Complaint
            </h1>
            <p className="text-muted-foreground">
              Enter the tracking ID returned after submission to view current status and progress.
            </p>
          </div>

          {/* Search card */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm mb-6">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 grid gap-2">
                <div className="space-y-1">
                  <Label htmlFor="trackingId" className="sr-only">Tracking ID</Label>
                  <Input
                    id="trackingId"
                    placeholder="Tracking ID (e.g. CMP-12345678)"
                    className="h-11"
                    {...register('trackingId')}
                  />
                  {errors.trackingId && (
                    <p className="text-sm text-destructive">{errors.trackingId.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="anonymousToken" className="sr-only">Anonymous Token</Label>
                  <Input
                    id="anonymousToken"
                    placeholder="Anonymous Token (optional)"
                    className="h-11"
                    {...register('anonymousToken')}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="h-11 px-6 shrink-0 font-semibold"
              >
                <Search className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Searching…' : 'Track'}
              </Button>
            </form>
          </div>

          {/* Result */}
          {complaint ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Complaint</p>
                  <h2 className="font-display text-xl font-bold text-card-foreground">{complaint.title}</h2>
                </div>
                <Badge variant={statusVariant(complaint.status)} className="self-start shrink-0 text-xs px-3 py-1">
                  {formatStatus(complaint.status)}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 rounded-xl bg-muted/40 p-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Tracking ID</p>
                  <p className="font-semibold text-foreground font-mono text-sm">{complaint.trackingId}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Category</p>
                  <p className="font-semibold text-foreground">{complaint.category}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Filed</p>
                  <p className="font-semibold text-foreground">{formatDate(complaint.createdAt)}</p>
                </div>
              </div>

              {complaint.description && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Description</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{complaint.description}</p>
                </div>
              )}

              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Progress timeline</p>
                <ComplaintStatusTimeline status={complaint.status} />
              </div>
            </motion.div>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-center px-6">
              <p className="text-muted-foreground text-sm">
                Enter a tracking ID above to see complaint status and progress.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
