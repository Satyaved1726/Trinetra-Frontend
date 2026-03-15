import { ShieldCheck, ShieldOff, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { adminService } from '@/services/adminService';
import { superAdminService, type ManagedAdmin } from '@/services/superAdminService';

export function SuperAdminDashboardPage() {
  const [admins, setAdmins] = useState<ManagedAdmin[]>([]);
  const [complaintsCount, setComplaintsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [adminList, complaints] = await Promise.all([
          superAdminService.getAdmins(),
          adminService.getAllComplaints()
        ]);
        setAdmins(adminList);
        setComplaintsCount(complaints.length);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to load super admin dashboard.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const activeAdmins = admins.filter((admin) => admin.active).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-primary">Super Admin</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">System Dashboard</h1>
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
                <CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5 text-primary" /> Total Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-4xl font-bold">{admins.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Active Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-4xl font-bold">{activeAdmins}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><ShieldOff className="h-5 w-5 text-amber-600" /> Complaints</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-4xl font-bold">{complaintsCount}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}