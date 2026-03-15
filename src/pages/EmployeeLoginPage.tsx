import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Fingerprint, LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

const employeeLoginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.')
});

type EmployeeLoginValues = z.infer<typeof employeeLoginSchema>;

export function EmployeeLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginEmployee } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<EmployeeLoginValues>({
    resolver: zodResolver(employeeLoginSchema)
  });

  const onSubmit = async (values: EmployeeLoginValues) => {
    try {
      const payload = {
        email: values.email.trim(),
        password: values.password
      };

      console.log('Employee login submit payload:', { email: payload.email });
      await loginEmployee(payload);
      toast.success('Welcome back.');
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/employee/dashboard', { replace: true });
    } catch (error) {
      console.error('Employee login failed:', error);
      toast.error(error instanceof Error ? error.message : 'Unable to sign in.');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Fingerprint className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Employee Login</h1>
            <p className="text-sm text-muted-foreground">Access your complaint workspace.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="employee-email">Email</Label>
            <Input id="employee-email" type="email" {...register('email')} placeholder="employee@company.com" />
            {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee-password">Password</Label>
            <Input id="employee-password" type="password" {...register('password')} placeholder="••••••••" />
            {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            <LogIn className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-5 text-sm text-muted-foreground">
          Admin user? <Link to="/auth/admin-login" className="font-medium text-primary">Switch to admin login</Link>
        </p>
      </motion.div>
    </div>
  );
}
