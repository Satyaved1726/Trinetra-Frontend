import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { superAdminService } from '@/services/superAdminService';

const createAdminSchema = z.object({
  name: z.string().optional(),
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.')
});

type CreateAdminValues = z.infer<typeof createAdminSchema>;

export function SuperAdminCreateAdminPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CreateAdminValues>({
    resolver: zodResolver(createAdminSchema)
  });

  const onSubmit = async (values: CreateAdminValues) => {
    try {
      await superAdminService.createAdmin({
        email: values.email.trim(),
        password: values.password
      });
      toast.success('Admin created successfully.');
      reset({ name: '', email: '', password: '' });
      navigate('/super-admin/admins');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create admin.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-primary">Super Admin</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Create Admin</h1>
      </div>

      <div className="max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name (optional)</Label>
            <Input id="name" {...register('name')} placeholder="Full name" />
            {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} placeholder="admin@company.com" />
            {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} placeholder="Create a secure password" />
            {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            <ShieldPlus className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Creating…' : 'Create Admin'}
          </Button>
        </form>
      </div>
    </div>
  );
}