import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  FileIcon,
  FileText,
  ImageIcon,
  Lock,
  ShieldCheck,
  Upload,
  Video
} from 'lucide-react';
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { complaintsApi } from '@/services/api';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const allowedMimeTypes = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'video/mp4',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
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
    .refine(
      (files) => files.every((file) => allowedMimeTypes.includes(file.type)),
      'Allowed formats: png, jpg, jpeg, mp4, pdf, docx.'
    )
    .refine((files) => files.every((file) => file.size <= MAX_FILE_SIZE), 'Each file must be 20MB or smaller.')
});

type SubmitComplaintFormValues = z.infer<typeof submitComplaintSchema>;

function humanFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function previewForFile(file: File) {
  if (file.type.startsWith('image/')) {
    return { type: 'image' as const, icon: ImageIcon };
  }
  if (file.type.startsWith('video/')) {
    return { type: 'video' as const, icon: Video };
  }
  if (file.type === 'application/pdf') {
    return { type: 'pdf' as const, icon: FileText };
  }

  return { type: 'doc' as const, icon: FileIcon };
}

export function SubmitComplaintPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [dragging, setDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

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

  const previews = useMemo(
    () =>
      selectedFiles.map((file) => ({
        file,
        previewUrl: file.type.startsWith('image/') || file.type.startsWith('video/') ? URL.createObjectURL(file) : null,
        ...previewForFile(file)
      })),
    [selectedFiles]
  );

  useEffect(() => {
    return () => {
      previews.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [previews]);

  const appendFiles = (incoming: File[]) => {
    const next = [...selectedFiles, ...incoming];
    setValue('evidenceFiles', next, { shouldDirty: true, shouldValidate: true });
  };

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
      setUploadProgress({});
      const response = await complaintsApi.submitComplaint(
        {
          title: values.title,
          description: values.description,
          category: values.category,
          anonymous: values.anonymous,
          evidenceFiles: values.evidenceFiles
        },
        {
          onUploadProgress: (fileName: string, percent: number) => {
            setUploadProgress((current) => ({ ...current, [fileName]: percent }));
          }
        }
      );

      toast.success(response.message ?? 'Complaint submitted successfully.');

      if (response.trackingId) {
        toast.info(`Tracking ID: ${response.trackingId}`, { duration: 9000 });
      }

      if (response.anonymousToken && values.anonymous) {
        toast.info(`Anonymous Token: ${response.anonymousToken}. Save this token to track your complaint later.`, {
          duration: 12000
        });
      }

      reset({ title: '', description: '', category: categories[0], anonymous: true, evidenceFiles: [] });
      setUploadProgress({});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit complaint right now.');
    }
  };

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
                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragging(false);
                      appendFiles(Array.from(event.dataTransfer.files));
                    }}
                    className={`rounded-2xl border border-dashed p-5 text-center transition ${
                      dragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
                    }`}
                  >
                    <Upload className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                    <p className="text-sm font-medium">Drag and drop files here</p>
                    <p className="mt-1 text-xs text-muted-foreground">png, jpg, jpeg, mp4, pdf, docx · max 20MB per file</p>
                    <div className="mt-3">
                      <Input
                        type="file"
                        multiple
                        accept=".png,.jpg,.jpeg,.mp4,.pdf,.docx"
                        onChange={(event: ChangeEvent<HTMLInputElement>) => appendFiles(Array.from(event.target.files ?? []))}
                      />
                    </div>
                  </div>
                  {errors.evidenceFiles ? <p className="text-sm text-destructive">{errors.evidenceFiles.message}</p> : null}

                  {selectedFiles.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {previews.map((item, index) => (
                        <div key={`${item.file.name}-${index}`} className="rounded-xl border border-border bg-background p-3">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <item.icon className="h-4 w-4 text-muted-foreground" />
                              <p className="max-w-[180px] truncate text-sm font-medium">{item.file.name}</p>
                            </div>
                            <button
                              type="button"
                              className="text-xs text-destructive"
                              onClick={() => {
                                const next = [...selectedFiles];
                                next.splice(index, 1);
                                setValue('evidenceFiles', next, { shouldDirty: true, shouldValidate: true });
                              }}
                            >
                              Remove
                            </button>
                          </div>

                          {item.type === 'image' && item.previewUrl ? (
                            <img src={item.previewUrl} alt={item.file.name} className="h-28 w-full rounded-lg object-cover" />
                          ) : null}
                          {item.type === 'video' && item.previewUrl ? (
                            <video src={item.previewUrl} controls className="h-28 w-full rounded-lg object-cover" />
                          ) : null}
                          {item.type === 'pdf' ? (
                            <div className="flex h-28 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                              PDF preview available after upload
                            </div>
                          ) : null}
                          {item.type === 'doc' ? (
                            <div className="flex h-28 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                              Document will be available for download
                            </div>
                          ) : null}

                          <p className="mt-2 text-xs text-muted-foreground">{humanFileSize(item.file.size)}</p>
                          {uploadProgress[item.file.name] ? (
                            <div className="mt-2">
                              <progress
                                className="h-2 w-full overflow-hidden rounded-full"
                                value={uploadProgress[item.file.name]}
                                max={100}
                                aria-label={`Upload progress for ${item.file.name}`}
                              />
                              <p className="mt-1 text-[11px] text-muted-foreground">{uploadProgress[item.file.name]}%</p>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
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
