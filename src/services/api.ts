import { adminService } from '@/services/adminService';
import { authService, extractToken } from '@/services/authService';
import { complaintService } from '@/services/complaintService';
import {
  ApiError,
  apiClient as api,
  clearStoredToken,
  setStoredToken,
  toApiError
} from '@/services/httpClient';

export { ApiError, api, clearStoredToken, extractToken, setStoredToken, toApiError };

export const authApi = {
  async adminLogin(payload: { email: string; password: string }) {
    const session = await authService.loginAdmin(payload);
    return { token: session.token, role: session.user.role, user: session.user };
  },
  async employeeLogin(payload: { email: string; password: string }) {
    const session = await authService.loginEmployee(payload);
    return { token: session.token, role: session.user.role, user: session.user };
  },
  register: authService.registerAdmin,
  registerEmployee: authService.registerEmployee
};

export const complaintsApi = {
  submitComplaint: complaintService.submitComplaint,
  trackComplaint: complaintService.trackComplaint,
  getComplaints: adminService.getAllComplaints,
  updateComplaintStatus: adminService.updateComplaintStatus,
  getMyComplaints: complaintService.getMyComplaints,
  addComment: complaintService.addComment,
  uploadAdditionalEvidence: complaintService.uploadAdditionalEvidence
};
