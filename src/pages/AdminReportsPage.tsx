import { FileBarChart2, RefreshCcw } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminComplaints } from '@/hooks/useAdminComplaints';

export function AdminReportsPage() {
  const { complaints, loading, reload } = useAdminComplaints();

  const summary = useMemo(() => {
    const anonymous = complaints.filter((complaint) => complaint.anonymous).length;
    const resolved = complaints.filter((complaint) => complaint.status === 'RESOLVED').length;
    const unresolved = complaints.length - resolved;

    return { anonymous, resolved, unresolved };
  }, [complaints]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Admin</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">Reports</h1>
        </div>
        <Button variant="outline" size="sm" disabled={loading} onClick={() => void reload().catch(() => toast.error('Unable to refresh reports.'))}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><FileBarChart2 className="h-5 w-5 text-primary" /> Total Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-bold">{complaints.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Anonymous Filings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-bold">{summary.anonymous}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Open Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-bold">{summary.unresolved}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}