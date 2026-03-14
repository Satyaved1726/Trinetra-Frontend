import { Badge } from '@/components/ui/badge';
import type { ComplaintStatus } from '@/types/complaint';
import { cn } from '@/utils/cn';
import { formatStatus } from '@/utils/formatters';

const steps = ['SUBMITTED', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'] as const;

function getStepState(currentStatus: ComplaintStatus, step: (typeof steps)[number]) {
  if (currentStatus === 'REJECTED') {
    if (step === 'SUBMITTED' || step === 'UNDER_REVIEW') {
      return 'complete';
    }

    return step === 'REJECTED' ? 'current-rejected' : 'future';
  }

  const order: Record<string, number> = {
    SUBMITTED: 0,
    UNDER_REVIEW: 1,
    RESOLVED: 2
  };

  const currentIndex = order[currentStatus] ?? 0;
  const stepIndex = order[step] ?? 99;

  if (stepIndex < currentIndex) {
    return 'complete';
  }

  if (stepIndex === currentIndex) {
    return `current-${step.toLowerCase()}`;
  }

  return 'future';
}

export function ComplaintStatusTimeline({ status }: { status: ComplaintStatus }) {
  return (
    <div className="space-y-4">
      <Badge
        variant={
          status === 'RESOLVED' ? 'success' : status === 'REJECTED' ? 'destructive' : status === 'UNDER_REVIEW' ? 'warning' : 'secondary'
        }
      >
        {formatStatus(status)}
      </Badge>
      <div className="grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => {
          const state = getStepState(status, step);

          return (
            <div
              key={step}
              className={cn(
                'rounded-3xl border px-4 py-4 transition-colors',
                state === 'complete' && 'border-slate-300 bg-slate-100/80',
                state === 'current-submitted' && 'border-slate-400 bg-slate-900 text-white',
                state === 'current-under_review' && 'border-amber-300 bg-amber-50',
                state === 'current-resolved' && 'border-emerald-300 bg-emerald-50',
                state === 'current-rejected' && 'border-rose-300 bg-rose-50',
                state === 'future' && 'border-dashed border-slate-200 bg-white/70 text-slate-400'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-current/20 bg-white/70 font-semibold">
                  {state === 'complete' ? '✓' : index + 1}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-current/70">Stage {index + 1}</p>
                  <p className="font-semibold">{formatStatus(step)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}