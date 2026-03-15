import { apiClient, requestWithFallback } from '@/services/httpClient';
import { uploadEvidence } from '@/services/evidenceUploadService';
import type { Complaint, SubmitComplaintPayload, SubmitComplaintResponse } from '@/types/complaint';

export const complaintService = {
  async submitComplaint(payload: SubmitComplaintPayload) {
    const evidenceFiles = payload.evidenceFiles ?? [];

    if (evidenceFiles.some((file) => file instanceof File)) {
      throw new Error('Evidence files must be uploaded first. Submit URL metadata only.');
    }

    const evidenceMetadata = evidenceFiles as Array<{ url: string; type?: string }>;

    const requestBody = {
      title: payload.title,
      description: payload.description,
      category: payload.category,
      isAnonymous: payload.anonymous,
      evidenceFiles: evidenceMetadata.map((file) => ({
        url: file.url,
        type: file.type
      }))
    };

    return requestWithFallback<SubmitComplaintResponse>([
      () => apiClient.post('/api/complaints/submit', requestBody),
      () => apiClient.post('/complaints/submit', requestBody)
    ]);
  },

  async trackComplaint(trackingId: string) {
    return requestWithFallback<Complaint>([
      () => apiClient.get(`/api/complaints/${encodeURIComponent(trackingId)}`),
      () => apiClient.get(`/complaints/track/${encodeURIComponent(trackingId)}`),
      () => apiClient.get(`/complaints/${encodeURIComponent(trackingId)}`)
    ]);
  },

  async getMyComplaints() {
    return requestWithFallback<Complaint[]>([
      () => apiClient.get('/api/complaints'),
      () => apiClient.get('/employee/complaints'),
      () => apiClient.get('/complaints/me')
    ]);
  },

  async addComment(complaintId: string, message: string) {
    return requestWithFallback([
      () => apiClient.post(`/complaints/${encodeURIComponent(complaintId)}/comments`, { message }),
      () => apiClient.post(`/employee/complaints/${encodeURIComponent(complaintId)}/comments`, { message })
    ]);
  },

  async uploadAdditionalEvidence(complaintId: string, files: File[]) {
    const uploads = await uploadEvidence(files);

    await requestWithFallback([
      () => apiClient.post(`/api/complaints/${encodeURIComponent(complaintId)}/evidence`, { evidence: uploads }),
      () => apiClient.post(`/complaints/${encodeURIComponent(complaintId)}/evidence`, { evidence: uploads }),
      () => apiClient.post(`/employee/complaints/${encodeURIComponent(complaintId)}/evidence`, { evidence: uploads })
    ]);

    return uploads;
  }
};
