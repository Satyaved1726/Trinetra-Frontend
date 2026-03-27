import { apiClient, requestWithFallback } from '@/services/httpClient';
import type { Complaint, ComplaintNote, ManagedComplaintStatus } from '@/types/complaint';

export interface ComplaintQuery {
  status?: string;
  category?: string;
  search?: string;
}

export interface ReportQuery {
  from?: string;
  to?: string;
  category?: string;
  status?: string;
}

export interface ReportMetrics {
  totalComplaints: number;
  resolutionRate: number;
  averageResolutionTime: number;
  complaintsOverTime: AdminAnalyticsPoint[];
  complaintsByCategory: AdminAnalyticsPoint[];
}

export interface AdminAnalyticsPoint {
  label: string;
  count: number;
}

export interface AdminAnalyticsResponse {
  totalComplaints: number;
  openComplaints: number;
  resolvedComplaints: number;
  rejectedComplaints?: number;
  anonymousComplaints: number;
  identifiedComplaints?: number;
  complaintsOverTime: AdminAnalyticsPoint[];
  complaintsByCategory: AdminAnalyticsPoint[];
  complaintsByStatus: AdminAnalyticsPoint[];
}

const EMPTY_ANALYTICS: AdminAnalyticsResponse = {
  totalComplaints: 0,
  openComplaints: 0,
  resolvedComplaints: 0,
  rejectedComplaints: 0,
  anonymousComplaints: 0,
  identifiedComplaints: 0,
  complaintsOverTime: [],
  complaintsByCategory: [],
  complaintsByStatus: []
};

function unwrapNestedData(payload: unknown): unknown {
  let current = payload;

  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      break;
    }

    if (!('data' in current)) {
      break;
    }

    current = (current as { data?: unknown }).data;
  }

  return current;
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
      count: toNumber(record.count ?? record.value)
    };
  });
}

function normalizeComplaintsPayload(payload: unknown): Complaint[] {
  const unwrappedPayload = unwrapNestedData(payload);

  if (Array.isArray(unwrappedPayload)) return unwrappedPayload as Complaint[];
  if (!unwrappedPayload || typeof unwrappedPayload !== 'object') return [];

  const record = unwrappedPayload as { complaints?: unknown; data?: unknown; content?: unknown; items?: unknown; results?: unknown };
  if (Array.isArray(record.complaints)) return record.complaints as Complaint[];
  if (Array.isArray(record.data)) return record.data as Complaint[];
  if (Array.isArray(record.content)) return record.content as Complaint[];
  if (Array.isArray(record.items)) return record.items as Complaint[];
  if (Array.isArray(record.results)) return record.results as Complaint[];

  if (Array.isArray(payload)) return payload as Complaint[];
  if (!payload || typeof payload !== 'object') return [];

  const root = payload as { complaints?: unknown; data?: unknown; content?: unknown; items?: unknown; results?: unknown };
  if (Array.isArray(root.complaints)) return root.complaints as Complaint[];
  if (Array.isArray(root.data)) return root.data as Complaint[];
  if (Array.isArray(root.content)) return root.content as Complaint[];
  if (Array.isArray(root.items)) return root.items as Complaint[];
  if (Array.isArray(root.results)) return root.results as Complaint[];

  if (root.data && typeof root.data === 'object') {
    const nested = root.data as {
      complaints?: unknown;
      data?: unknown;
      content?: unknown;
      items?: unknown;
      results?: unknown;
    };
    if (Array.isArray(nested.data)) return nested.data as Complaint[];
    if (Array.isArray(nested.complaints)) return nested.complaints as Complaint[];
    if (Array.isArray(nested.content)) return nested.content as Complaint[];
    if (Array.isArray(nested.items)) return nested.items as Complaint[];
    if (Array.isArray(nested.results)) return nested.results as Complaint[];

    if (nested.data && typeof nested.data === 'object') {
      const nestedData = nested.data as { complaints?: unknown; data?: unknown; items?: unknown; results?: unknown };
      if (Array.isArray(nestedData.complaints)) return nestedData.complaints as Complaint[];
      if (Array.isArray(nestedData.data)) return nestedData.data as Complaint[];
      if (Array.isArray(nestedData.items)) return nestedData.items as Complaint[];
      if (Array.isArray(nestedData.results)) return nestedData.results as Complaint[];
    }
  }

  return [];
}

function normalizeAnalyticsPayload(payload: unknown): AdminAnalyticsResponse {
  const unwrappedPayload = unwrapNestedData(payload);

  if (!unwrappedPayload || typeof unwrappedPayload !== 'object') return EMPTY_ANALYTICS;

  const fallback: AdminAnalyticsResponse = EMPTY_ANALYTICS;

  if (!payload || typeof payload !== 'object') return fallback;

  const root = unwrappedPayload as Record<string, unknown>;
  const levelOne =
    (root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) :
      root.content && typeof root.content === 'object' ? (root.content as Record<string, unknown>) :
      root.analytics && typeof root.analytics === 'object' ? (root.analytics as Record<string, unknown>) : root) as Record<string, unknown>;

  const source =
    levelOne.data && typeof levelOne.data === 'object'
      ? (levelOne.data as Record<string, unknown>)
      : levelOne.content && typeof levelOne.content === 'object'
        ? (levelOne.content as Record<string, unknown>)
        : levelOne.analytics && typeof levelOne.analytics === 'object'
          ? (levelOne.analytics as Record<string, unknown>)
          : levelOne;

  return {
    totalComplaints: toNumber(source.totalComplaints),
    openComplaints: toNumber(source.openComplaints),
    resolvedComplaints: toNumber(source.resolvedComplaints),
    rejectedComplaints: toNumber(source.rejectedComplaints),
    anonymousComplaints: toNumber(source.anonymousComplaints),
    identifiedComplaints: toNumber(source.identifiedComplaints),
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

    try {
      const payload = await requestWithFallback<unknown>([
        () => apiClient.get('/api/admin/complaints', { params }),
        () => apiClient.get('/api/complaints', { params }),
        () => apiClient.get('/admin/complaints', { params }),
        () => apiClient.get('/complaints/all', { params }),
        () => apiClient.get('/complaints', { params })
      ]);

      return normalizeComplaintsPayload(payload);
    } catch (error) {
      console.error('API ERROR:', error);
      return [];
    }
  },

  async getComplaintById(id: string) {
    const payload = await requestWithFallback<unknown>([
      () => apiClient.get(`/api/complaints/${encodeURIComponent(id)}`),
      () => apiClient.get(`/api/admin/complaints/${encodeURIComponent(id)}`),
      () => apiClient.get(`/admin/complaints/${encodeURIComponent(id)}`),
      () => apiClient.get(`/complaints/${encodeURIComponent(id)}`)
    ]);

    if (!payload || typeof payload !== 'object') return undefined;
    const record = payload as { data?: unknown; content?: unknown };
    const source = (record.data ?? record.content ?? payload) as Complaint;
    return source;
  },

  async updateComplaintStatus(complaint: Complaint, status: ManagedComplaintStatus) {
    const primaryId = complaint.id ?? complaint.trackingId;

    return requestWithFallback<Complaint>([
      () => apiClient.put(`/api/complaints/${encodeURIComponent(String(primaryId))}/status`, { status }),
      () => apiClient.patch(`/api/admin/complaints/${encodeURIComponent(String(primaryId))}/status`, { status }),
      () => apiClient.patch(`/admin/complaints/${encodeURIComponent(String(primaryId))}/status`, { status }),
      () => apiClient.put(`/complaints/${encodeURIComponent(String(primaryId))}/status`, { status }),
      () => apiClient.put(`/complaints/${encodeURIComponent(complaint.trackingId)}/status`, { status })
    ]);
  },

  async assignComplaintOfficer(complaint: Complaint, officerIdOrName: string) {
    const primaryId = complaint.id ?? complaint.trackingId;

    return requestWithFallback<Complaint>([
      () => apiClient.put(`/api/complaints/${encodeURIComponent(String(primaryId))}/assign`, { officer: officerIdOrName }),
      () => apiClient.put(`/api/admin/complaints/${encodeURIComponent(String(primaryId))}/assign`, { officer: officerIdOrName }),
      () => apiClient.patch(`/api/admin/complaints/${encodeURIComponent(String(primaryId))}`, { assignedOfficer: officerIdOrName }),
      () => apiClient.patch(`/complaints/${encodeURIComponent(String(primaryId))}`, { assignedOfficer: officerIdOrName })
    ]);
  },

  async addComplaintNote(complaint: Complaint, note: string) {
    const primaryId = complaint.id ?? complaint.trackingId;

    const payload = await requestWithFallback<unknown>([
      () => apiClient.post(`/api/complaints/${encodeURIComponent(String(primaryId))}/notes`, { note }),
      () => apiClient.post(`/api/admin/complaints/${encodeURIComponent(String(primaryId))}/notes`, { note }),
      () => apiClient.patch(`/api/admin/complaints/${encodeURIComponent(String(primaryId))}/notes`, { notes: note })
    ]);

    if (payload && typeof payload === 'object') {
      const record = payload as { data?: unknown; content?: unknown };
      const source = (record.data ?? record.content ?? payload) as Complaint;
      if (source && typeof source === 'object' && ('trackingId' in source || 'id' in source)) {
        return source;
      }
    }

    return this.getComplaintById(String(primaryId));
  },

  async getComplaintNotes(complaint: Complaint) {
    const primaryId = complaint.id ?? complaint.trackingId;
    const payload = await requestWithFallback<unknown>([
      () => apiClient.get(`/api/complaints/${encodeURIComponent(String(primaryId))}/notes`),
      () => apiClient.get(`/api/admin/complaints/${encodeURIComponent(String(primaryId))}/notes`)
    ]);

    if (Array.isArray(payload)) return payload as ComplaintNote[];
    if (!payload || typeof payload !== 'object') return [];
    const record = payload as { data?: unknown; content?: unknown; items?: unknown; notes?: unknown; results?: unknown };
    const source = record.data ?? record.content ?? record.items ?? record.notes ?? record.results;
    return Array.isArray(source) ? (source as ComplaintNote[]) : [];
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
    try {
      const response = await apiClient.get<unknown>('/api/admin/analytics');
      const payload = (response.data as { data?: unknown })?.data ?? response.data;
      return normalizeAnalyticsPayload(payload);
    } catch (error) {
      console.error('API ERROR:', error);
      return EMPTY_ANALYTICS;
    }
  },

  async getReports(query?: ReportQuery) {
    const params = {
      from: query?.from,
      to: query?.to,
      category: query?.category,
      status: query?.status
    };

    try {
      const payload = await requestWithFallback<unknown>([
        () => apiClient.get('/api/admin/reports', { params }),
        () => apiClient.get('/admin/reports', { params })
      ]);

      return normalizeComplaintsPayload(payload);
    } catch (error) {
      console.error('API ERROR:', error);
      return [];
    }
  },

  async exportReportsCSV(query?: ReportQuery): Promise<void> {
    const params = {
      from: query?.from,
      to: query?.to,
      category: query?.category,
      status: query?.status
    };

    try {
      const response = await apiClient.get('/api/admin/reports/export/csv', {
        params,
        responseType: 'blob'
      });

      const blob = response.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reports-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      throw error;
    }
  },

  async exportReportsPDF(query?: ReportQuery): Promise<void> {
    const params = {
      from: query?.from,
      to: query?.to,
      category: query?.category,
      status: query?.status
    };

    try {
      const response = await apiClient.get('/api/admin/reports/export/pdf', {
        params,
        responseType: 'blob'
      });

      const blob = response.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reports-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      throw error;
    }
  }
};
