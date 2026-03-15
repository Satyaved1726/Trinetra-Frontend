import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { superAdminService, type ManagedAdmin } from '@/services/superAdminService';

export function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState<ManagedAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setAdmins(await superAdminService.getAdmins());
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to load admins.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const toggleAdmin = async (admin: ManagedAdmin, active: boolean) => {
    try {
      const updated = await superAdminService.disableAdmin(admin.id, active);
      setAdmins((current) => current.map((item) => (item.id === admin.id ? updated : item)));
      toast.success(`${admin.name} ${active ? 'enabled' : 'disabled'}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update admin status.');
    }
  };

  const deleteAdmin = async (admin: ManagedAdmin) => {
    try {
      await superAdminService.deleteAdmin(admin.id);
      setAdmins((current) => current.filter((item) => item.id !== admin.id));
      toast.success(`${admin.name} deleted.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete admin.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-primary">Super Admin</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Admin Management</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {admins.map((admin) => (
              <div key={admin.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{admin.name}</p>
                    <Badge>{admin.role}</Badge>
                    <Badge variant={admin.active ? 'success' : 'destructive'}>{admin.active ? 'Active' : 'Disabled'}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{admin.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Access</span>
                    <Switch checked={admin.active} onCheckedChange={(checked) => void toggleAdmin(admin, checked)} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => void deleteAdmin(admin)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}