import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Lock, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.')
});

type LoginFormValues = z.infer<typeof loginSchema>;

function getBackendMessage(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const response = (error as {
      response?: { data?: { message?: string; error?: string; errors?: string[]; validationErrors?: Record<string, string> } };
    }).response;
    if (response?.data?.message) return response.data.message;
    if (response?.data?.error) return response.data.error;
    if (Array.isArray(response?.data?.errors) && response.data.errors.length > 0) return response.data.errors[0];
    if (response?.data?.validationErrors) return Object.values(response.data.validationErrors).join(' ');
  }

  return error instanceof Error ? error.message : 'Login failed';
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAdmin } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (values: LoginFormValues) => {
    const payload = {
      email: values.email.trim(),
      password: values.password
    };

    try {
      console.log('Login submit payload:', { email: payload.email });
      await loginAdmin(payload);
      toast.success('Signed in successfully.');
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/admin/dashboard', { replace: true });
    } catch (error) {
      console.error('Login submit failed:', error);
      const message = getBackendMessage(error);
      toast.error(message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Ambient glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-600/20 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-violet-600/20 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl text-white tracking-[0.2em]">TRINETRA</span>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-7">
            <h1 className="font-display text-2xl font-bold text-white mb-2">Admin Sign In</h1>
            <p className="text-slate-400 text-sm">Access your complaint management dashboard</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Email address</Label>
              <Input
                type="email"
                placeholder="admin@company.com"
                {...register('email')}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50"
              />
              {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50"
              />
              {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/20"
            >
              <Lock className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Need access?{' '}
            <Link to="/auth/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Register
            </Link>
          </p>

          <p className="text-center text-sm text-slate-500 mt-2">
            Employee?{' '}
            <Link to="/auth/employee-login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign in here
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          <Link to="/" className="hover:text-slate-400 transition-colors">
            ← Back to home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
