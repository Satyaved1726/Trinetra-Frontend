import { motion } from 'framer-motion';
import { BarChart3, CalendarRange, PieChart, RefreshCcw, SearchCheck, TimerReset } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import { ComplaintCharts } from '@/components/ComplaintCharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DashboardOutletContext } from '@/layouts/DashboardLayout';
import { useAdminComplaints } from '@/hooks/useAdminComplaints';
import { buildComplaintStats, formatDate } from '@/utils/formatters';

function InsightCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">{title}</p>
      <p className="mt-3 font-display text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function AdminAnalyticsPage() {
  const { adminSearchQuery } = useOutletContext<DashboardOutletContext>();
  const { complaints, loading, reload } = useAdminComplaints();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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

      return (!startBoundary || complaintDate >= startBoundary) && (!endBoundary || complaintDate <= endBoundary) && matchesSearch;
    });
  }, [adminSearchQuery, complaints, fromDate, toDate]);

  const stats = useMemo(() => buildComplaintStats(filteredComplaints), [filteredComplaints]);
  const topCategory = useMemo(() => {
    const categoryCounts = filteredComplaints.reduce<Record<string, number>>((accumulator, complaint) => {
      accumulator[complaint.category] = (accumulator[complaint.category] ?? 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(categoryCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'No data';
  }, [filteredComplaints]);
  const anonymousShare = filteredComplaints.length
    ? `${Math.round((filteredComplaints.filter((complaint) => complaint.anonymous).length / filteredComplaints.length) * 100)}%`
    : '0%';
  const latestFiling = filteredComplaints[0] ? formatDate(filteredComplaints[0].createdAt) : 'No data';

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Analytics</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">Operational Analytics</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review complaint trends, category concentration, and backlog indicators using the shared admin search context.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void reload()} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Reload analytics
        </Button>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm lg:grid-cols-[1fr_1fr]">
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard title="Top Category" value={topCategory} description="Most frequent complaint category in the active view." />
        <InsightCard title="Anonymous Share" value={anonymousShare} description="Percentage of complaints filed without identity disclosure." />
        <InsightCard title="Open Backlog" value={String(stats.openComplaints)} description="Submitted and under-review cases still awaiting closure." />
        <InsightCard title="Latest Filing" value={latestFiling} description="Most recent complaint timestamp in the filtered dataset." />
      </div>

      <ComplaintCharts complaints={filteredComplaints} stats={stats} />

      <div className="grid gap-4 xl:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Volume Insight</h2>
              <p className="text-xs text-muted-foreground">Total complaints currently in scope</p>
            </div>
          </div>
          <p className="mt-5 font-display text-4xl font-bold text-foreground">{stats.totalComplaints}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <SearchCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Resolution Rate</h2>
              <p className="text-xs text-muted-foreground">Resolved complaints relative to visible workload</p>
            </div>
          </div>
          <p className="mt-5 font-display text-4xl font-bold text-foreground">
            {stats.totalComplaints ? `${Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100)}%` : '0%'}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <TimerReset className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Escalation Watch</h2>
              <p className="text-xs text-muted-foreground">Rejected plus unresolved cases needing review</p>
            </div>
          </div>
          <p className="mt-5 font-display text-4xl font-bold text-foreground">{stats.openComplaints + stats.rejectedComplaints}</p>
        </motion.div>
      </div>
    </div>
  );
}