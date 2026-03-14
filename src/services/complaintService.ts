import { apiClient, requestWithFallback } from '@/services/httpClient';
import { uploadService } from '@/services/uploadService';
import type { Complaint, SubmitComplaintPayload, SubmitComplaintResponse } from '@/types/complaint';

interface SubmitComplaintOptions {
  onUploadProgress?: (fileName: string, percent: number) => void;
}

export const complaintService = {
  async submitComplaint(payload: SubmitComplaintPayload, options?: SubmitComplaintOptions) {
    const files = payload.evidenceFiles ?? (payload.evidenceFile ? [payload.evidenceFile] : []);
    const uploads = files.length
      ? await uploadService.uploadEvidenceFiles(files, (item) => {
          options?.onUploadProgress?.(item.fileName, item.percent);
        })
      : [];

    const requestBody = {
      title: payload.title,
      description: payload.description,
      category: payload.category,
      anonymous: payload.anonymous,
      evidence: uploads,
      evidenceUrls: uploads.map((item) => item.url),
      evidenceUrl: uploads[0]?.url
    };

    return requestWithFallback<SubmitComplaintResponse>([
      () => apiClient.post('/complaints', requestBody),
      () => apiClient.post(payload.anonymous ? '/complaints/anonymous' : '/complaints/submit', requestBody)
    ]);
  },

  async trackComplaint(trackingId: string) {
    return requestWithFallback<Complaint>([
      () => apiClient.get(`/complaints/track/${encodeURIComponent(trackingId)}`),
      () => apiClient.get(`/complaints/${encodeURIComponent(trackingId)}`)
    ]);
  },

  async getMyComplaints() {
    return requestWithFallback<Complaint[]>([
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
    const uploads = await uploadService.uploadEvidenceFiles(files);

    await requestWithFallback([
      () => apiClient.post(`/complaints/${encodeURIComponent(complaintId)}/evidence`, { evidence: uploads }),
      () => apiClient.post(`/employee/complaints/${encodeURIComponent(complaintId)}/evidence`, { evidence: uploads })
    ]);

    return uploads;
  }
};
