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

export const adminService = {
  async getAllComplaints(query?: ComplaintQuery) {
    const params = {
      status: query?.status,
      category: query?.category,
      q: query?.search
    };

    return requestWithFallback<Complaint[]>([
      () => apiClient.get('/api/admin/complaints', { params }),
      () => apiClient.get('/api/complaints', { params }),
      () => apiClient.get('/admin/complaints', { params }),
      () => apiClient.get('/complaints/all', { params }),
      () => apiClient.get('/complaints', { params })
    ]);
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
    return apiClient.get<AdminAnalyticsResponse>('/api/admin/analytics').then((response) => response.data);
  }
};
