import { Activity, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { adminService } from '@/services/adminService';
import { superAdminService } from '@/services/superAdminService';

export function SuperAdminSystemAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [adminCount, setAdminCount] = useState(0);
  const [activeAdminCount, setActiveAdminCount] = useState(0);
  const [complaintCount, setComplaintCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [admins, complaints] = await Promise.all([
          superAdminService.getAdmins(),
          adminService.getAllComplaints()
        ]);
        setAdminCount(admins.length);
        setActiveAdminCount(admins.filter((admin) => admin.active).length);
        setComplaintCount(complaints.length);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to load system analytics.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-primary">Super Admin</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">System Analytics</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          <>
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Admin Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-4xl font-bold">{adminCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Active Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-4xl font-bold">{activeAdminCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-amber-600" /> Complaint Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-4xl font-bold">{complaintCount}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}