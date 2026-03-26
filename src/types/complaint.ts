export type ManagedComplaintStatus =
  | 'UNDER_REVIEW'
  | 'INVESTIGATING'
  | 'RESOLVED'
  | 'REJECTED';
export type ComplaintStatus = 'SUBMITTED' | ManagedComplaintStatus | string;
export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;

export interface ComplaintEvidence {
  id?: string;
  name?: string;
  url: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
}

export interface ComplaintComment {
  id?: string;
  author?: string;
  message: string;
  createdAt: string;
}

export interface ComplaintNote {
  id?: string;
  note: string;
  createdAt: string;
  createdBy?: string;
}

export interface ComplaintTimelineEvent {
  status: ComplaintStatus;
  at: string;
}

export interface Complaint {
  id?: string | number;
  trackingId: string;
  title: string;
  description?: string;
  category: string;
  priority?: ComplaintPriority;
  status: ComplaintStatus;
  createdAt: string;
  submittedAt?: string;
  anonymous?: boolean;
  reporterName?: string;
  reporterEmail?: string;
  assignedOfficer?: string;
  assignedOfficerId?: string;
  investigationNotes?: string;
  comments?: ComplaintComment[];
  notes?: ComplaintNote[];
  timeline?: ComplaintTimelineEvent[];
  statusHistory?: ComplaintTimelineEvent[];
  underReviewAt?: string;
  investigatingAt?: string;
  resolvedAt?: string;
  rejectedAt?: string;
  evidenceFiles?: Array<{
    id?: string;
    fileUrl: string;
    fileType?: string;
  }>;
  evidence_files?: Array<{
    id?: string;
    url: string;
    type?: string;
  }>;
  evidence?: ComplaintEvidence[];
  evidenceUrl?: string;
}

export interface SubmitComplaintPayload {
  title: string;
  description: string;
  category: string;
  anonymous: boolean;
  evidenceFiles?: Array<File | { url: string; type?: string }>;
  evidenceFile?: File | null;
}

export interface SubmitComplaintResponse {
  message?: string;
  trackingId?: string;
  anonymousToken?: string;
}

export interface ComplaintStats {
  totalComplaints: number;
  openComplaints: number;
  resolvedComplaints: number;
  rejectedComplaints: number;
  anonymousComplaints: number;
}