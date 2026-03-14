import { apiClient, requestWithFallback } from '@/services/httpClient';
import type { Complaint, ManagedComplaintStatus } from '@/types/complaint';

export interface ComplaintQuery {
  status?: string;
  category?: string;
  search?: string;
}

export const adminService = {
  async getAllComplaints(query?: ComplaintQuery) {
    const params = {
      status: query?.status,
      category: query?.category,
      q: query?.search
    };

    return requestWithFallback<Complaint[]>([
      () => apiClient.get('/admin/complaints', { params }),
      () => apiClient.get('/complaints/all', { params }),
      () => apiClient.get('/complaints', { params })
    ]);
  },

  async updateComplaintStatus(complaint: Complaint, status: ManagedComplaintStatus) {
    const primaryId = complaint.id ?? complaint.trackingId;

    return requestWithFallback<Complaint>([
      () => apiClient.patch(`/admin/complaints/${encodeURIComponent(String(primaryId))}/status`, { status }),
      () => apiClient.put(`/complaints/${encodeURIComponent(String(primaryId))}/status`, { status }),
      () => apiClient.put(`/complaints/${encodeURIComponent(complaint.trackingId)}/status`, { status })
    ]);
  },

  async addInvestigationNotes(complaint: Complaint, notes: string) {
    const primaryId = complaint.id ?? complaint.trackingId;

    return requestWithFallback<Complaint>([
      () => apiClient.patch(`/admin/complaints/${encodeURIComponent(String(primaryId))}/notes`, { notes }),
      () => apiClient.patch(`/complaints/${encodeURIComponent(String(primaryId))}`, { investigationNotes: notes })
    ]);
  }
};
