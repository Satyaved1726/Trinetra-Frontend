import { apiClient, requestWithFallback } from '@/services/httpClient';
import type { Complaint, ManagedComplaintStatus } from '@/types/complaint';

export interface ComplaintQuery {
  status?: string;
  category?: string;
  search?: string;
}

export interface AdminAnalyticsPoint {
  label: string;
  count: number;
}

export interface AdminAnalyticsResponse {
  totalComplaints: number;
  openComplaints: number;
  resolvedComplaints: number;
  anonymousComplaints: number;
  complaintsOverTime: AdminAnalyticsPoint[];
  complaintsByCategory: AdminAnalyticsPoint[];
  complaintsByStatus: AdminAnalyticsPoint[];
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function ensurePointArray(value: unknown): AdminAnalyticsPoint[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    const record = item as { label?: unknown; count?: unknown; name?: unknown; value?: unknown };
    return {
      label: String(record.label ?? record.name ?? 'Unknown'),
      count: typeof record.count === 'number' ? record.count : typeof record.value === 'number' ? record.value : 0
    };
  });
}

function normalizeComplaintsPayload(payload: unknown): Complaint[] {
  if (Array.isArray(payload)) return payload as Complaint[];
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as { complaints?: unknown; data?: unknown; items?: unknown; results?: unknown };
  if (Array.isArray(record.complaints)) return record.complaints as Complaint[];
  if (Array.isArray(record.data)) return record.data as Complaint[];
  if (Array.isArray(record.items)) return record.items as Complaint[];
  if (Array.isArray(record.results)) return record.results as Complaint[];

  if (record.data && typeof record.data === 'object') {
    const nested = record.data as { complaints?: unknown; data?: unknown; items?: unknown; results?: unknown };
    if (Array.isArray(nested.data)) return nested.data as Complaint[];
    if (Array.isArray(nested.complaints)) return nested.complaints as Complaint[];
    if (Array.isArray(nested.items)) return nested.items as Complaint[];
    if (Array.isArray(nested.results)) return nested.results as Complaint[];

    if (nested.data && typeof nested.data === 'object') {
      const nestedData = nested.data as { complaints?: unknown; items?: unknown; results?: unknown };
      if (Array.isArray(nestedData.complaints)) return nestedData.complaints as Complaint[];
      if (Array.isArray(nestedData.items)) return nestedData.items as Complaint[];
      if (Array.isArray(nestedData.results)) return nestedData.results as Complaint[];
    }
  }

  return [];
}

function normalizeAnalyticsPayload(payload: unknown): AdminAnalyticsResponse {
  const fallback: AdminAnalyticsResponse = {
    totalComplaints: 0,
    openComplaints: 0,
    resolvedComplaints: 0,
    anonymousComplaints: 0,
    complaintsOverTime: [],
    complaintsByCategory: [],
    complaintsByStatus: []
  };

  if (!payload || typeof payload !== 'object') return fallback;

  const root = payload as Record<string, unknown>;
  const levelOne = (root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : root) as Record<string, unknown>;
  const source =
    levelOne.data && typeof levelOne.data === 'object'
      ? (levelOne.data as Record<string, unknown>)
      : levelOne;

  return {
    totalComplaints: toNumber(source.totalComplaints),
    openComplaints: toNumber(source.openComplaints),
    resolvedComplaints: toNumber(source.resolvedComplaints),
    anonymousComplaints: toNumber(source.anonymousComplaints),
    complaintsOverTime: ensurePointArray(source.complaintsOverTime),
    complaintsByCategory: ensurePointArray(source.complaintsByCategory),
    complaintsByStatus: ensurePointArray(source.complaintsByStatus)
  };
}

export const adminService = {
  async getAllComplaints(query?: ComplaintQuery) {
    const params = {
      status: query?.status,
      category: query?.category,
      q: query?.search
    };

    const payload = await requestWithFallback<unknown>([
      () => apiClient.get('/api/admin/complaints', { params }),
      () => apiClient.get('/api/complaints', { params }),
      () => apiClient.get('/admin/complaints', { params }),
      () => apiClient.get('/complaints/all', { params }),
      () => apiClient.get('/complaints', { params })
    ]);

    return normalizeComplaintsPayload(payload);
  },

  async updateComplaintStatus(complaint: Complaint, status: ManagedComplaintStatus) {
    const primaryId = complaint.id ?? complaint.trackingId;

    return requestWithFallback<Complaint>([
      () => apiClient.patch(`/api/admin/complaints/${encodeURIComponent(String(primaryId))}/status`, { status }),
      () => apiClient.put(`/api/complaints/${encodeURIComponent(String(primaryId))}/status`, { status }),
      () => apiClient.patch(`/admin/complaints/${encodeURIComponent(String(primaryId))}/status`, { status }),
      () => apiClient.put(`/complaints/${encodeURIComponent(String(primaryId))}/status`, { status }),
      () => apiClient.put(`/complaints/${encodeURIComponent(complaint.trackingId)}/status`, { status })
    ]);
  },

  async addInvestigationNotes(complaint: Complaint, notes: string) {
    const primaryId = complaint.id ?? complaint.trackingId;

    return requestWithFallback<Complaint>([
      () => apiClient.patch(`/api/admin/complaints/${encodeURIComponent(String(primaryId))}/notes`, { notes }),
      () => apiClient.patch(`/admin/complaints/${encodeURIComponent(String(primaryId))}/notes`, { notes }),
      () => apiClient.patch(`/complaints/${encodeURIComponent(String(primaryId))}`, { investigationNotes: notes })
    ]);
  },

  async getAnalytics() {
    return apiClient.get<unknown>('/api/admin/analytics').then((response) => normalizeAnalyticsPayload(response.data));
  }
};
