import { apiClient, requestWithFallback } from '@/services/httpClient';
import { uploadService } from '@/services/uploadService';
import type { Complaint, SubmitComplaintPayload, SubmitComplaintResponse } from '@/types/complaint';

interface SubmitComplaintOptions {
  onUploadProgress?: (fileName: string, percent: number) => void;
}

export const complaintService = {
  async submitComplaint(payload: SubmitComplaintPayload, options?: SubmitComplaintOptions) {
    const files = payload.evidenceFiles ?? (payload.evidenceFile ? [payload.evidenceFile] : []);

    if (files.length > 0) {
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('description', payload.description);
      formData.append('category', payload.category);
      formData.append('anonymous', String(Boolean(payload.anonymous)));
      files.forEach((file) => formData.append('files', file));

      return requestWithFallback<SubmitComplaintResponse>([
        () =>
          apiClient.post('/api/complaints', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (event) => {
              const percent = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
              files.forEach((file) => options?.onUploadProgress?.(file.name, percent));
            }
          }),
        () =>
          apiClient.post('/complaints', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
      ]);
    }

    const requestBody = {
      title: payload.title,
      description: payload.description,
      category: payload.category,
      anonymous: payload.anonymous
    };

    return requestWithFallback<SubmitComplaintResponse>([
      () => apiClient.post('/api/complaints', requestBody),
      () => apiClient.post('/complaints', requestBody),
      () => apiClient.post(payload.anonymous ? '/complaints/anonymous' : '/complaints/submit', requestBody)
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
    const uploads = await uploadService.uploadEvidenceFiles(files);

    await requestWithFallback([
      () => apiClient.post(`/api/complaints/${encodeURIComponent(complaintId)}/evidence`, { evidence: uploads }),
      () => apiClient.post(`/complaints/${encodeURIComponent(complaintId)}/evidence`, { evidence: uploads }),
      () => apiClient.post(`/employee/complaints/${encodeURIComponent(complaintId)}/evidence`, { evidence: uploads })
    ]);

    return uploads;
  }
};
