export type ManagedComplaintStatus =
  | 'UNDER_REVIEW'
  | 'INVESTIGATING'
  | 'RESOLVED'
  | 'REJECTED';
export type ComplaintStatus = 'SUBMITTED' | ManagedComplaintStatus | string;

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

export interface Complaint {
  id?: string | number;
  trackingId: string;
  title: string;
  description?: string;
  category: string;
  status: ComplaintStatus;
  createdAt: string;
  anonymous?: boolean;
  reporterName?: string;
  reporterEmail?: string;
  investigationNotes?: string;
  comments?: ComplaintComment[];
  evidence?: ComplaintEvidence[];
  evidenceUrl?: string;
}

export interface SubmitComplaintPayload {
  title: string;
  description: string;
  category: string;
  anonymous: boolean;
  evidenceFiles?: File[];
  evidenceFile?: File | null;
}

export interface SubmitComplaintResponse {
  message?: string;
  trackingId?: string;
}

export interface ComplaintStats {
  totalComplaints: number;
  openComplaints: number;
  resolvedComplaints: number;
  rejectedComplaints: number;
  anonymousComplaints: number;
}