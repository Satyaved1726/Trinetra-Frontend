import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Calendar, CheckCircle2, Eye, Mail, Play, SearchCheck, Send, Upload, User, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { adminService } from '@/services/adminService';
import { apiClient as api, toApiError } from '@/services/httpClient';
import { formatDate, formatStatus } from '@/utils/formatters';
import type { Complaint, ComplaintNote, ComplaintPriority, ManagedComplaintStatus } from '@/types/complaint';

const TIMELINE_STEPS: ManagedComplaintStatus[] = ['UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'REJECTED'];

const PROGRESS_STEPS = [
  { key: 'SUBMITTED', label: 'Submitted', icon: CheckCircle2 },
  { key: 'UNDER_REVIEW', label: 'Review', icon: SearchCheck },
  { key: 'INVESTIGATING', label: 'Investigating', icon: SearchCheck },
  { key: 'RESOLVED', label: 'Resolved', icon: CheckCircle2 }
] as const;
const STATUS_COLORS: Record<string, string> = {
  'SUBMITTED': 'from-blue-500/20 to-cyan-500/20',
  'UNDER_REVIEW': 'from-purple-500/20 to-purple-500/20',
  'INVESTIGATING': 'from-blue-500/20 to-sky-500/20',
  'RESOLVED': 'from-green-500/20 to-emerald-500/20',
  'REJECTED': 'from-red-500/20 to-rose-500/20'
};

const CATEGORY_COLORS: Record<string, string> = {
  'HR': 'bg-blue-500/20 text-blue-300 border-blue-400/20',
  'Finance': 'bg-green-500/20 text-green-300 border-green-400/20',
  'Operations': 'bg-purple-500/20 text-purple-300 border-purple-400/20',
  'IT': 'bg-orange-500/20 text-orange-300 border-orange-400/20',
  'Compliance': 'bg-red-500/20 text-red-300 border-red-400/20',
  'Other': 'bg-slate-500/20 text-slate-300 border-slate-400/20'
};

function normalizeManagedStatus(status: Complaint['status'] | undefined): ManagedComplaintStatus {
  if (status === 'UNDER_REVIEW' || status === 'INVESTIGATING' || status === 'RESOLVED' || status === 'REJECTED') {
    return status;
  }
  return 'UNDER_REVIEW';
}

function statusToTimelineIndex(status: Complaint['status'] | undefined) {
  const normalized = normalizeManagedStatus(status);
  if (normalized === 'UNDER_REVIEW') return 1;
  if (normalized === 'INVESTIGATING') return 2;
  return 3;
}

function inferMediaType(fileUrl: string, fileType?: string): 'image' | 'video' | 'other' {
  const value = (fileType ?? fileUrl).toLowerCase();
  if (value.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileUrl)) return 'image';
  if (value.startsWith('video/') || /\.(mp4|webm|ogg|mov|m4v)$/i.test(fileUrl)) return 'video';
  return 'other';
}

interface EvidenceItem {
  id: string;
  url: string;
  type: 'image' | 'video' | 'other';
  name?: string;
}

function formatDateTime(value?: string) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

const safe = (value: unknown) => (value ? value.toString() : '');

function priorityClass(priority?: ComplaintPriority) {
  if (priority === 'CRITICAL') return 'bg-red-500/20 text-red-300 border-red-400/20';
  if (priority === 'HIGH') return 'bg-orange-500/20 text-orange-300 border-orange-400/20';
  if (priority === 'MEDIUM') return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/20';
  return 'bg-slate-500/20 text-slate-300 border-slate-400/20';
}

function extractEvidence(complaint: Complaint): EvidenceItem[] {
  const items: EvidenceItem[] = [];

  if (Array.isArray(complaint.evidenceFiles)) {
    complaint.evidenceFiles.forEach((file, idx) => {
      if (file.fileUrl) {
        items.push({
          id: file.id ?? `file-${idx}`,
          url: file.fileUrl,
          type: inferMediaType(file.fileUrl, file.fileType)
        });
      }
    });
  }

  if (Array.isArray(complaint.evidence)) {
    complaint.evidence.forEach((file, idx) => {
      if (file.url) {
        items.push({
          id: file.id ?? `evidence-${idx}`,
          url: file.url,
          type: inferMediaType(file.url, file.mimeType),
          name: file.name
        });
      }
    });
  }

  if (Array.isArray(complaint.evidence_files)) {
    complaint.evidence_files.forEach((file, idx) => {
      if (file.url) {
        items.push({
          id: file.id ?? `evidence-file-${idx}`,
          url: file.url,
          type: inferMediaType(file.url, file.type)
        });
      }
    });
  }

  if (complaint.evidenceUrl && !items.some(i => i.url === complaint.evidenceUrl)) {
    items.push({
      id: 'evidence-url',
      url: complaint.evidenceUrl,
      type: inferMediaType(complaint.evidenceUrl)
    });
  }

  return items;
}

function MediaPreviewModal({ 
  isOpen, 
  onClose, 
  media, 
  title 
}: { 
  isOpen: boolean;
  onClose: () => void;
  media?: EvidenceItem;
  title: string;
}) {
  if (!isOpen || !media) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="relative h-[92vh] w-[96vw] rounded-2xl bg-slate-900 p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          title="Close preview"
          className="absolute right-4 top-4 z-10 rounded-lg bg-slate-800 p-2 hover:bg-slate-700 transition-colors"
        >
          <X className="h-5 w-5 text-slate-300" />
        </button>

        {media.type === 'image' && (
          <img
            src={media.url}
            alt={media.name || 'Evidence'}
            loading="lazy"
            className="h-full w-full rounded-lg object-contain"
          />
        )}

        {media.type === 'video' && (
          <video
            src={media.url}
            controls
            preload="metadata"
            className="h-full w-full rounded-lg"
          />
        )}

        {media.type === 'other' && (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="h-12 w-12 text-slate-500 mb-4" />
            <p className="text-slate-400">{media.name || 'File'}</p>
            <p className="text-sm text-slate-500 mt-2">Preview not available</p>
            <a
              href={media.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Download
            </a>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function TimelineStep({ 
  step, 
  index, 
  isActive, 
  isCompleted 
}: { 
  step: ManagedComplaintStatus;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
}) {
  const stepColors: Record<ManagedComplaintStatus, { bg: string; text: string; icon: string }> = {
    'UNDER_REVIEW': { bg: 'bg-purple-500', text: 'text-purple-300', icon: '📋' },
    'INVESTIGATING': { bg: 'bg-blue-500', text: 'text-blue-300', icon: '🔍' },
    'RESOLVED': { bg: 'bg-green-500', text: 'text-green-300', icon: '✓' },
    'REJECTED': { bg: 'bg-red-500', text: 'text-red-300', icon: '✗' }
  };

  const colors = stepColors[step];

  return (
    <div className="flex items-center flex-1">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.1 }}
        className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
          isCompleted || isActive
            ? `${colors.bg} border-white/30 text-white shadow-lg`
            : 'border-slate-600 bg-slate-800/50 text-slate-500'
        }`}
      >
        <span className="text-lg">{colors.icon}</span>
      </motion.div>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: index * 0.1 + 0.1 }}
        className={`flex-1 h-1 mx-2 rounded-full origin-left ${
          isCompleted ? colors.bg : 'bg-slate-700'
        }`}
        style={{ opacity: index < TIMELINE_STEPS.length - 1 ? 1 : 0 }}
      />

      <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-400 whitespace-nowrap">
        {formatStatus(step)}
      </p>
    </div>
  );
}

export function AdminComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<ManagedComplaintStatus>('UNDER_REVIEW');
  const [noteInput, setNoteInput] = useState('');
  const [admins, setAdmins] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [noteHistory, setNoteHistory] = useState<ComplaintNote[]>([]);
  const [savingStatus, setSavingStatus] = useState(false);
  const [assigningOfficer, setAssigningOfficer] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  const [previewMedia, setPreviewMedia] = useState<EvidenceItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const evidence = useMemo(() => complaint ? extractEvidence(complaint) : [], [complaint]);
  const imageEvidence = evidence.filter(e => e.type === 'image');
  const videoEvidence = evidence.filter(e => e.type === 'video');
  const otherEvidence = evidence.filter(e => e.type === 'other');

  const parseCommentList = (payload: unknown): ComplaintNote[] => {
    if (!Array.isArray(payload)) return [];

    return payload.map((item, index) => {
      const record = item as {
        id?: string;
        note?: string;
        message?: string;
        createdAt?: string;
        created_at?: string;
        author?: string;
        createdBy?: string;
      };

      return {
        id: record.id ?? `comment-${index}`,
        note: record.note ?? record.message ?? '',
        createdAt: record.createdAt ?? record.created_at ?? new Date().toISOString(),
        createdBy: record.author ?? record.createdBy ?? 'Admin'
      };
    });
  };

  const fetchComments = async (targetComplaint?: Complaint) => {
    const complaintId = targetComplaint?.id ?? targetComplaint?.trackingId ?? complaint?.id ?? complaint?.trackingId ?? id;
    if (!complaintId) return;

    try {
      const response = await api.get(`/api/admin/complaints/${encodeURIComponent(String(complaintId))}/comments`);
      const source = (response.data as { data?: unknown })?.data ?? response.data;
      const parsed = parseCommentList(source);
      if (parsed.length > 0) {
        setNoteHistory(parsed);
      }
    } catch (error) {
      console.error('Comments load failed', error);
      if (targetComplaint) {
        try {
          const fallbackNotes = await adminService.getComplaintNotes(targetComplaint);
          setNoteHistory(fallbackNotes);
        } catch {
          // Keep current notes if both comments and fallback notes endpoints fail.
        }
      }
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await api.get('/api/admin/admins');
      const source = (response.data as { data?: unknown })?.data ?? response.data;
      const list = Array.isArray(source) ? source : [];
      const mapped = list
        .map((item) => {
          const record = item as { id?: string | number; name?: string; fullName?: string; email?: string };
          if (!record.id && !record.name && !record.fullName) return null;
          return {
            id: String(record.id ?? record.email ?? record.name ?? record.fullName),
            name: String(record.name ?? record.fullName ?? record.email ?? 'Admin')
          };
        })
        .filter((item): item is { id: string; name: string } => Boolean(item));

      setAdmins(mapped);
    } catch (error) {
      console.error('Admins load failed', error);
      setAdmins([]);
    }
  };

  const fetchComplaint = async (options?: { silent?: boolean }) => {
    if (!id) return;

    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await api.get(`/api/admin/complaints/${id}`);
      const data = (res.data as { data?: Complaint | null })?.data;

      if (!data) {
        setError('Complaint not found');
        setComplaint(null);
        return;
      }

      setComplaint(data);
      setSelectedStatus(normalizeManagedStatus(data.status));
      setSelectedAdmin(data.assignedOfficer || '');

      const initialNotes = Array.isArray(data.notes)
        ? data.notes
        : Array.isArray(data.comments)
          ? data.comments.map((comment, index) => ({
              id: comment.id ?? `comment-${index}`,
              note: comment.message,
              createdAt: comment.createdAt,
              createdBy: comment.author
            }))
          : [];
      setNoteHistory(initialNotes);

      await fetchComments(data);
    } catch (err) {
      console.error('API ERROR:', err);
      const apiError = toApiError(err);
      setError(apiError.message);
      setComplaint(null);
      toast.error('Failed to load complaint', { description: apiError.message });
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!id) return;
    void fetchComplaint();
  }, [id]);

  useEffect(() => {
    void fetchAdmins();
  }, []);

  const handleStatusSave = async () => {
    if (!complaint || !selectedStatus || savingStatus) return;

    setSavingStatus(true);
    try {
      await api.put(`/api/admin/complaints/${encodeURIComponent(String(complaint.id ?? complaint.trackingId))}/status`, {
        status: selectedStatus
      });

      toast.success('Status updated');
      await fetchComplaint({ silent: true });
    } catch (err) {
      console.error('Status update failed', err);
      toast.error('Failed to update');
    } finally {
      setSavingStatus(false);
    }
  };

  const assignOfficer = async () => {
    if (!complaint || !selectedAdmin || assigningOfficer) return;

    setAssigningOfficer(true);

    try {
      await api.put(`/api/admin/complaints/${encodeURIComponent(String(complaint.id ?? complaint.trackingId))}/assign`, {
        admin: selectedAdmin
      });

      toast.success('Officer assigned');
      await fetchComplaint({ silent: true });
    } catch (err) {
      const apiError = toApiError(err);
      toast.error('Failed to assign officer', { description: apiError.message });
    } finally {
      setAssigningOfficer(false);
    }
  };

  const addNote = async () => {
    if (!complaint || !noteInput.trim() || addingNote) return;

    setAddingNote(true);
    try {
      const note = noteInput.trim();
      await api.post(`/api/admin/complaints/${encodeURIComponent(String(complaint.id ?? complaint.trackingId))}/comments`, {
        note
      });

      setNoteInput('');
      await fetchComments();
      await fetchComplaint({ silent: true });
      toast.success('Note added');
    } catch (err) {
      const apiError = toApiError(err);
      toast.error('Failed to add note', { description: apiError.message });
    } finally {
      setAddingNote(false);
    }
  };

  const currentStatusIndex = statusToTimelineIndex(selectedStatus || complaint?.status);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-32 rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center"
      >
        <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-red-300 mb-2">Error Loading Complaint</h2>
        <p className="text-red-200 mb-6">{error || 'Complaint not found'}</p>
        <Button onClick={() => navigate('/admin/complaints')} className="bg-blue-600 hover:bg-blue-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Complaints
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <Button
          variant="outline"
          onClick={() => navigate('/admin/complaints')}
          className="border-slate-600 hover:bg-slate-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-xl font-bold text-slate-100 md:text-3xl">{complaint.title}</h1>
        <div className="w-24" /> {/* Spacer */}
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left Column - Complaint Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6 md:col-span-2"
        >
          {/* Details Card */}
          <div className={`rounded-2xl border border-slate-700/50 bg-gradient-to-br ${STATUS_COLORS[complaint.status] || STATUS_COLORS['UNDER_REVIEW']} p-6 backdrop-blur-sm`}>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Complaint Details</h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400 mb-1">Tracking ID</p>
                <p className="font-mono text-sm text-cyan-400">{complaint.trackingId}</p>
              </div>

              {complaint.description && (
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400 mb-2">Description</p>
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{safe(complaint.description)}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400 mb-2">Category</p>
                  <Badge className={`${CATEGORY_COLORS[complaint.category] || CATEGORY_COLORS['Other']} border`}>
                    {complaint.category}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400 mb-2">Status</p>
                  <Badge className="bg-blue-500/20 border-blue-400/20 text-blue-300">
                    {formatStatus(normalizeManagedStatus(complaint.status))}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400 mb-2">Priority</p>
                  <Badge className={`${priorityClass(complaint.priority)} border`}>
                    {complaint.priority ?? 'LOW'}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400 mb-2">Assigned Officer</p>
                  <Badge className="bg-indigo-500/20 border-indigo-400/20 text-indigo-300 border">
                    {complaint.assignedOfficer || 'Unassigned'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Reporter Info Card */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Reporter Information</h3>

            <div className="space-y-4">
              {complaint.anonymous ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/20 border border-slate-600/30">
                  <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                  <p className="text-sm text-yellow-300">Anonymous Complaint</p>
                </div>
              ) : (
                <>
                  {complaint.reporterName && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Reporter Name</p>
                        <p className="text-sm text-slate-200">{complaint.reporterName}</p>
                      </div>
                    </div>
                  )}
                  {complaint.reporterEmail && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Email</p>
                        <p className="text-sm text-slate-200">{complaint.reporterEmail}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center gap-3 pt-2 border-t border-slate-700/50">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Created Date</p>
                  <p className="text-sm text-slate-200">{formatDateTime(complaint.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Investigation Notes Card */}
          {complaint.investigationNotes && (
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Investigation Notes</h3>
              <p className="text-sm text-slate-200 leading-relaxed">{complaint.investigationNotes}</p>
            </div>
          )}

          {/* Timeline Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6 backdrop-blur-sm"
          >
            <h3 className="text-lg font-semibold text-slate-100">Resolution Timeline</h3>
            <div className="mt-6 overflow-x-auto">
              <div className="min-w-[560px]">
                <div className="relative flex items-center">
                  {PROGRESS_STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isComplete = currentStatusIndex >= index;

                    return (
                      <div key={step.key} className="flex flex-1 items-center">
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                            isComplete ? 'border-emerald-300 bg-emerald-500/30 text-emerald-100' : 'border-slate-600 bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </motion.div>
                        {index < PROGRESS_STEPS.length - 1 && (
                          <div className="mx-2 h-1 flex-1 rounded-full bg-slate-700">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: isComplete ? '100%' : '0%' }}
                              className="h-full rounded-full bg-emerald-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[11px] uppercase tracking-[0.1em] text-slate-400">
                  {PROGRESS_STEPS.map((step) => (
                    <p key={step.key}>{step.label}</p>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column - Admin Panel & Evidence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Admin Actions Card */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6 backdrop-blur-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Admin Actions</h3>

            {/* Status Dropdown */}
            <div>
              <label className="block text-xs uppercase tracking-[0.12em] text-slate-400 mb-2">
                Change Status
              </label>
              <select
                aria-label="Change complaint status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(normalizeManagedStatus(e.target.value as Complaint['status']))}
                disabled={savingStatus}
                className="w-full rounded-lg bg-slate-700/50 border border-slate-600 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(['UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'REJECTED'] as const).map((optionStatus) => (
                  <option key={optionStatus} value={optionStatus}>{formatStatus(optionStatus)}</option>
                ))}
              </select>
              <Button
                onClick={() => void handleStatusSave()}
                disabled={savingStatus || !complaint || selectedStatus === normalizeManagedStatus(complaint.status)}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
              >
                {savingStatus ? 'Saving...' : 'Save'}
              </Button>
            </div>

            {/* Officer Assignment */}
            <div className="border-t border-slate-700/50 pt-4">
              <label className="block text-xs uppercase tracking-[0.12em] text-slate-400 mb-2">
                Assign Officer
              </label>
              <select
                aria-label="Assign officer"
                value={selectedAdmin}
                onChange={(e) => setSelectedAdmin(e.target.value)}
                disabled={assigningOfficer}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedAdmin ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-600 bg-slate-700/50'
                }`}
              >
                <option value="">Select officer</option>
                {admins.map((admin) => (
                  <option key={admin.id} value={admin.id}>{admin.name}</option>
                ))}
              </select>
              <Button
                onClick={() => void assignOfficer()}
                disabled={!selectedAdmin || assigningOfficer}
                className="w-full mt-2 bg-green-600 hover:bg-green-700"
              >
                <User className="mr-2 h-4 w-4" />
                {assigningOfficer ? 'Assigning...' : 'Assign'}
              </Button>
            </div>

            {/* Notes Section */}
            <div className="border-t border-slate-700/50 pt-4">
              <label className="block text-xs uppercase tracking-[0.12em] text-slate-400 mb-2">
                Add Notes
              </label>
              <Textarea
                placeholder="Add investigation notes..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="bg-slate-700/50 border-slate-600 min-h-24 resize-none"
              />
              <Button
                onClick={() => void addNote()}
                disabled={!noteInput.trim() || addingNote}
                className="w-full mt-2 bg-purple-600 hover:bg-purple-700"
              >
                <Send className="mr-2 h-4 w-4" />
                {addingNote ? 'Saving Note...' : 'Add Note'}
              </Button>

              <div className="mt-4 space-y-2 max-h-48 overflow-auto pr-1">
                {noteHistory.length === 0 ? (
                  <p className="text-xs text-slate-500">No notes yet.</p>
                ) : (
                  noteHistory.map((note) => (
                    <div key={note.id ?? `${note.createdAt}-${note.note}`} className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
                      <p className="text-sm text-slate-200">{note.note}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {note.createdBy ?? 'Admin'} · {formatDateTime(note.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Evidence Card */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Evidence</h3>

            {evidence.length === 0 && (
              <p className="text-sm text-slate-400">No evidence available</p>
            )}

            {evidence.length > 0 && (
              <div className="space-y-4">
                {imageEvidence.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-400 mb-2">Images</p>
                    <div className="grid grid-cols-2 gap-3">
                      {imageEvidence.map((img) => (
                        <motion.button
                          key={img.id}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => {
                            setPreviewMedia(img);
                            setShowPreview(true);
                          }}
                          className="group relative overflow-hidden rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                        >
                          <img
                            src={img.url}
                            loading="lazy"
                            alt={img.name || 'Evidence'}
                            className="h-24 w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                              <Eye className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {videoEvidence.length > 0 && (
                  <div className="border-t border-slate-700/50 pt-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-400 mb-2">Videos</p>
                    <div className="grid grid-cols-1 gap-3">
                      {videoEvidence.map((vid) => (
                        <motion.button
                          key={vid.id}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => {
                            setPreviewMedia(vid);
                            setShowPreview(true);
                          }}
                          className="group w-full overflow-hidden rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                        >
                          <div className="relative">
                            <video
                              src={vid.url}
                              controls
                              preload="none"
                              className="h-44 w-full bg-black object-cover"
                            />
                            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-black/35 flex items-center justify-center">
                              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                                <Play className="h-5 w-5 text-white" />
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {otherEvidence.length > 0 && (
                  <div className="border-t border-slate-700/50 pt-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-400 mb-2">Other Files</p>
                    <div className="space-y-2">
                      {otherEvidence.map((file) => (
                        <a
                          key={file.id}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600 hover:border-slate-500 hover:bg-slate-700/40 transition-all"
                        >
                          <Upload className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-300">{file.name || 'File'}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Media Preview Modal */}
      <MediaPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        media={previewMedia || undefined}
        title={complaint.title}
      />
    </div>
  );
}
