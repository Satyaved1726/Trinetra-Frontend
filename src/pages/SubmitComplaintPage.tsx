import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Lock, ShieldCheck, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { EvidenceDropzone, MAX_EVIDENCE_FILE_SIZE, isAcceptedEvidenceFile } from '@/components/EvidenceDropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { uploadEvidence } from '@/services/evidenceUploadService';
import { complaintsApi } from '@/services/api';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const categories = ['Harassment', 'Corruption', 'Discrimination', 'Workplace Abuse', 'Safety', 'Other'];
const DRAFT_KEY = 'trinetra_submit_draft';

const submitComplaintSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  category: z.string().min(1, 'Select a category.'),
  anonymous: z.boolean(),
  evidenceFiles: z
    .array(z.instanceof(File))
    .max(8, 'You can upload up to 8 files at once.')
    .refine((files) => files.every((file) => isAcceptedEvidenceFile(file)), 'Allowed formats: jpg, png, jpeg, mp4, pdf, doc, docx, zip.')
    .refine((files) => files.every((file) => file.size <= MAX_FILE_SIZE), 'Each file must be 20MB or smaller.')
});

type SubmitComplaintFormValues = z.infer<typeof submitComplaintSchema>;

interface SubmissionResult {
  message?: string;
  trackingId?: string;
  anonymousToken?: string;
  anonymous: boolean;
}

export function SubmitComplaintPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<SubmitComplaintFormValues>({
    resolver: zodResolver(submitComplaintSchema),
    defaultValues: {
      title: '',
      description: '',
      category: categories[0],
      anonymous: true,
      evidenceFiles: []
    }
  });

  const anonymous = watch('anonymous');
  const includeIdentity = !anonymous;
  const selectedFiles = watch('evidenceFiles');

  useEffect(() => {
    const stored = window.sessionStorage.getItem(DRAFT_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as Pick<SubmitComplaintFormValues, 'title' | 'description' | 'category' | 'anonymous'>;
      reset({
        title: parsed.title,
        description: parsed.description,
        category: parsed.category,
        anonymous: parsed.anonymous,
        evidenceFiles: []
      });
      window.sessionStorage.removeItem(DRAFT_KEY);
      toast.info('Your draft was restored. Please reattach evidence files before submitting.');
    } catch {
      window.sessionStorage.removeItem(DRAFT_KEY);
    }
  }, [reset]);

  const onSubmit = async (values: SubmitComplaintFormValues) => {
    const token = window.localStorage.getItem('token');

    if (!values.anonymous && (!isAuthenticated || !token)) {
      window.sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          title: values.title,
          description: values.description,
          category: values.category,
          anonymous: values.anonymous
        })
      );

      toast.info('Include Identity requires login. Redirecting…');
      navigate('/auth/login', {
        replace: true,
        state: { from: location.pathname }
      });
      return;
    }

    try {
      const uploadedEvidence = values.evidenceFiles.length > 0 ? await uploadEvidence(values.evidenceFiles) : [];

      const response = await complaintsApi.submitComplaint({
        title: values.title,
        description: values.description,
        category: values.category,
        anonymous: values.anonymous,
        evidenceFiles: uploadedEvidence
      });

      toast.success(response.message ?? 'Complaint submitted successfully.');

      setSubmissionResult({
        message: response.message,
        trackingId: response.trackingId,
        anonymousToken: response.anonymousToken,
        anonymous: values.anonymous
      });

      reset({ title: '', description: '', category: categories[0], anonymous: true, evidenceFiles: [] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit complaint right now.');
    }
  };

  if (submissionResult) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="rounded-3xl border border-emerald-300/40 bg-card p-8 shadow-sm sm:p-10">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-600">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Complaint Submitted Successfully</p>
                  <h1 className="font-display text-3xl font-bold tracking-tight">Complaint Submitted Successfully</h1>
                </div>
              </div>

              <p className="text-sm text-muted-foreground sm:text-base">
                {submissionResult.message ?? 'Your complaint has been submitted successfully.'}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-muted/30 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Tracking ID</p>
                  <p className="mt-2 text-2xl font-semibold tracking-wide">{submissionResult.trackingId ?? 'Pending'}</p>
                </div>

                {submissionResult.anonymous ? (
                  <div className="rounded-2xl border border-amber-400/50 bg-amber-500/10 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Anonymous Token</p>
                    <p className="mt-2 text-2xl font-semibold tracking-wide">{submissionResult.anonymousToken ?? 'Not returned'}</p>
                    <p className="mt-3 text-sm text-muted-foreground">Save this token to track your complaint later.</p>
                  </div>
                ) : null}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button type="button" onClick={() => navigate('/track-complaint')}>
                  Track Complaint
                </Button>
                <Button type="button" variant="outline" onClick={() => setSubmissionResult(null)}>
                  Submit Another Complaint
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="mb-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Secure Submission</p>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Submit a Complaint</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              File anonymously or include your identity. Add multiple evidence files with preview and progress tracking.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" placeholder="Brief summary of your complaint" {...register('title')} />
                  {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" rows={6} placeholder="Describe what happened with key facts, timelines, and impact..." {...register('description')} />
                  {errors.description ? <p className="text-sm text-destructive">{errors.description.message}</p> : null}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
                      {...register('category')}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {errors.category ? <p className="text-sm text-destructive">{errors.category.message}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label className="block">Include Identity</Label>
                    <Controller
                      control={control}
                      name="anonymous"
                      render={({ field }) => (
                        <div
                          className={`rounded-xl border p-4 transition ${
                            field.value
                              ? 'border-emerald-500/40 bg-emerald-500/10'
                              : 'border-amber-500/40 bg-amber-500/10'
                          }`}
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-sm font-medium">
                              {includeIdentity ? 'Include Identity' : 'Submit Anonymously'}
                            </p>
                            <Switch
                              checked={includeIdentity}
                              onCheckedChange={(checked) => field.onChange(!checked)}
                              id="anonymous"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {includeIdentity
                              ? 'Complaint is linked to your account. Login is required.'
                              : 'Submit without identity and track using tracking ID + anonymous token.'}
                          </p>
                        </div>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Evidence Upload (optional)</Label>
                  <EvidenceDropzone
                    files={selectedFiles}
                    disabled={isSubmitting}
                    error={errors.evidenceFiles?.message}
                    onChange={(files) => setValue('evidenceFiles', files, { shouldDirty: true, shouldValidate: true })}
                  />
                  <p className="text-xs text-muted-foreground">Each file must be {MAX_EVIDENCE_FILE_SIZE / (1024 * 1024)}MB or smaller.</p>
                </div>

                <Button type="submit" disabled={isSubmitting} size="lg" className="w-full sm:w-auto">
                  <Upload className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Submitting…' : 'Submit Complaint'}
                </Button>
              </form>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-emerald-300/40 bg-emerald-500/10 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-semibold">Submit Anonymously</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Recommended for sensitive cases. Your name and email are excluded from admin view and reports.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Identity Included Flow</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  If you disable anonymous mode, TRINETRA requires employee authentication and returns you to this form automatically.
                </p>
              </div>

              <div className="rounded-2xl border border-amber-400/50 bg-amber-500/10 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold">Evidence Guidelines</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Use clear filenames and unedited files where possible.</li>
                  <li>Upload multiple files to strengthen context.</li>
                  <li>Do not include unrelated personal information.</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
