import { apiClient } from '@/services/httpClient';

export interface ManagedAdmin {
  id: string;
  username?: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  active: boolean;
  createdAt: string | null;
}

export interface CreateAdminPayload {
  email: string;
  password: string;
}

function toManagedAdmin(input: unknown): ManagedAdmin {
  const admin = (input ?? {}) as Partial<ManagedAdmin> & { id?: string | number };
  const email = admin.email ?? admin.username ?? '';

  return {
    id: String(admin.id ?? ''),
    email,
    username: admin.username ?? email,
    role: (admin.role as ManagedAdmin['role']) ?? 'ADMIN',
    active: admin.active ?? true,
    createdAt: admin.createdAt ?? null
  };
}

export const superAdminService = {
  async getAdmins() {
    const data = (await apiClient.get('/api/super-admin/admins')).data as unknown;

    if (Array.isArray(data)) {
      return data.map(toManagedAdmin);
    }

    const admins =
      typeof data === 'object' && data !== null && 'admins' in data
        ? ((data as { admins?: unknown[] }).admins ?? [])
        : [];

    return admins.map(toManagedAdmin);
  },

  async createAdmin(payload: CreateAdminPayload) {
    const data = (
      await apiClient.post('/api/super-admin/create-admin', {
        email: payload.email,
        password: payload.password
      })
    ).data as unknown;
    if (typeof data === 'object' && data !== null && ('id' in data || 'email' in data || 'username' in data)) {
      return toManagedAdmin(data);
    }

    return null;
  },

  async disableAdmin(adminId: string, active: boolean) {
    if (active) {
      throw new Error('Re-enabling admins is not supported by the current backend API.');
    }

    const data = (await apiClient.put(`/api/super-admin/admin/${encodeURIComponent(adminId)}/disable`)).data as unknown;
    return toManagedAdmin(data);
  },

  async deleteAdmin(adminId: string) {
    await apiClient.delete(`/api/super-admin/admin/${encodeURIComponent(adminId)}`);
  }
};