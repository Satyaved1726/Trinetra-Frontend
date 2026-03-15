import { apiClient, requestWithFallback } from '@/services/httpClient';

export interface ManagedAdmin {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  active: boolean;
  createdAt: string;
}

export interface CreateAdminPayload {
  name: string;
  email: string;
  password: string;
}

export const superAdminService = {
  async getAdmins() {
    return requestWithFallback<ManagedAdmin[]>([
      () => apiClient.get('/api/super-admin/admins'),
      () => apiClient.get('/api/admins'),
      () => apiClient.get('/super-admin/admins')
    ]);
  },

  async createAdmin(payload: CreateAdminPayload) {
    return requestWithFallback<ManagedAdmin>([
      () => apiClient.post('/api/super-admin/admins', payload),
      () => apiClient.post('/api/admins', payload),
      () => apiClient.post('/super-admin/admins', payload)
    ]);
  },

  async disableAdmin(adminId: string, active: boolean) {
    return requestWithFallback<ManagedAdmin>([
      () => apiClient.patch(`/api/super-admin/admins/${encodeURIComponent(adminId)}/status`, { active }),
      () => apiClient.patch(`/api/admins/${encodeURIComponent(adminId)}/status`, { active }),
      () => apiClient.patch(`/super-admin/admins/${encodeURIComponent(adminId)}/status`, { active })
    ]);
  },

  async deleteAdmin(adminId: string) {
    return requestWithFallback<void>([
      () => apiClient.delete(`/api/super-admin/admins/${encodeURIComponent(adminId)}`),
      () => apiClient.delete(`/api/admins/${encodeURIComponent(adminId)}`),
      () => apiClient.delete(`/super-admin/admins/${encodeURIComponent(adminId)}`)
    ]);
  }
};