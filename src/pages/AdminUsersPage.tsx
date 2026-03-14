import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const ADMIN_TEAM_KEY = 'trinetra_admin_team';

const memberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.email('Enter a valid email address.'),
  role: z.enum(['Super Admin', 'Investigator', 'Reviewer'])
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface AdminMember {
  id: string;
  name: string;
  email: string;
  role: MemberFormValues['role'];
  active: boolean;
  createdAt: string;
}

const defaultMembers: AdminMember[] = [
  {
    id: 'admin-1',
    name: 'Asha Menon',
    email: 'asha@trinetra.local',
    role: 'Super Admin',
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'admin-2',
    name: 'Rohit Sinha',
    email: 'rohit@trinetra.local',
    role: 'Investigator',
    active: true,
    createdAt: new Date().toISOString()
  }
];

function roleVariant(role: AdminMember['role']) {
  if (role === 'Super Admin') return 'default';
  if (role === 'Investigator') return 'warning';
  return 'secondary';
}

export function AdminUsersPage() {
  const [members, setMembers] = useState<AdminMember[]>(() => {
    const stored = window.localStorage.getItem(ADMIN_TEAM_KEY);
    if (!stored) {
      return defaultMembers;
    }

    try {
      return JSON.parse(stored) as AdminMember[];
    } catch {
      return defaultMembers;
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'Reviewer'
    }
  });

  useEffect(() => {
    window.localStorage.setItem(ADMIN_TEAM_KEY, JSON.stringify(members));
  }, [members]);

  const onSubmit = async (values: MemberFormValues) => {
    setMembers((current) => [
      {
        id: crypto.randomUUID(),
        name: values.name,
        email: values.email,
        role: values.role,
        active: true,
        createdAt: new Date().toISOString()
      },
      ...current
    ]);
    toast.success(`Added ${values.name} to the admin team.`);
    reset({ name: '', email: '', role: 'Reviewer' });
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Users</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">Access and Roles</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage the frontend admin roster, role visibility, and active access state while backend user APIs are still pending.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Team Directory</h2>
              <p className="text-xs text-muted-foreground">Persisted locally for the current browser workspace.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {members.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-background p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{member.name}</p>
                      <Badge variant={roleVariant(member.role)}>{member.role}</Badge>
                      <Badge variant={member.active ? 'success' : 'destructive'}>{member.active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-3 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground">
                      <span>Access</span>
                      <Switch
                        checked={member.active}
                        onCheckedChange={(checked) =>
                          setMembers((current) =>
                            current.map((item) => (item.id === member.id ? { ...item, active: checked } : item))
                          )
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setMembers((current) => current.filter((item) => item.id !== member.id));
                        toast.success(`Removed ${member.name} from the local roster.`);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Invite Admin</h2>
              <p className="text-xs text-muted-foreground">Adds a local admin record for UI prototyping and access modeling.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} placeholder="Full name" />
              {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="user@company.com" />
              {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                {...register('role')}
                className="flex h-12 w-full rounded-2xl border border-border/70 bg-background px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
              >
                <option value="Super Admin">Super Admin</option>
                <option value="Investigator">Investigator</option>
                <option value="Reviewer">Reviewer</option>
              </select>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Add admin member
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}