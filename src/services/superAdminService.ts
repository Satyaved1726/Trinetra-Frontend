const API_BASE = import.meta.env.VITE_API_URL || 'https://trinetra-backend-lzk9.onrender.com';

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

function getAuthHeaders() {
  const token = window.localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function parseResponse(response: Response) {
  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String((payload as { message?: string }).message ?? 'Request failed')
        : 'Request failed';
    throw new Error(message);
  }

  return payload;
}

export const superAdminService = {
  async getAdmins() {
    const response = await fetch(`${API_BASE}/api/super-admin/admins`, {
      headers: getAuthHeaders()
    });
    const data = await parseResponse(response);

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
    const response = await fetch(`${API_BASE}/api/super-admin/create-admin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        email: payload.email,
        password: payload.password
      })
    });

    const data = await parseResponse(response);
    if (typeof data === 'object' && data !== null && ('id' in data || 'email' in data || 'username' in data)) {
      return toManagedAdmin(data);
    }

    return null;
  },

  async disableAdmin(adminId: string, active: boolean) {
    if (active) {
      throw new Error('Re-enabling admins is not supported by the current backend API.');
    }

    const response = await fetch(`${API_BASE}/api/super-admin/admin/${encodeURIComponent(adminId)}/disable`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    const data = await parseResponse(response);
    return toManagedAdmin(data);
  },

  async deleteAdmin(adminId: string) {
    const response = await fetch(`${API_BASE}/api/super-admin/admin/${encodeURIComponent(adminId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    await parseResponse(response);
  }
};