import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { adminService } from '@/services/adminService';
import { ApiError } from '@/services/httpClient';
import type { Complaint, ManagedComplaintStatus } from '@/types/complaint';

function normalizeComplaintsResponse(payload: unknown): Complaint[] {
  if (Array.isArray(payload)) {
    return payload as Complaint[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const root = payload as {
    complaints?: unknown;
    data?: unknown;
    items?: unknown;
    results?: unknown;
  };

  if (Array.isArray(root.complaints)) return root.complaints as Complaint[];
  if (Array.isArray(root.data)) return root.data as Complaint[];
  if (Array.isArray(root.items)) return root.items as Complaint[];
  if (Array.isArray(root.results)) return root.results as Complaint[];

  if (root.data && typeof root.data === 'object') {
    const nested = root.data as {
      complaints?: unknown;
      data?: unknown;
      items?: unknown;
      results?: unknown;
    };

    if (Array.isArray(nested.complaints)) return nested.complaints as Complaint[];
    if (Array.isArray(nested.data)) return nested.data as Complaint[];
    if (Array.isArray(nested.items)) return nested.items as Complaint[];
    if (Array.isArray(nested.results)) return nested.results as Complaint[];
  }

  return [];
}

export function useAdminComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const reload = useCallback(async (options?: { silent?: boolean }) => {
    const shouldSetLoading = !options?.silent;

    try {
      if (shouldSetLoading) {
        setLoading(true);
      }

      const response = (await adminService.getAllComplaints()) as unknown;
      console.log('RAW API:', response);

      const normalizedComplaints = normalizeComplaintsResponse(response);
      setComplaints(normalizedComplaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setComplaints([]);
      if (error instanceof ApiError && error.status === 403) {
        toast.error('Admin access denied for complaints API. Please login with an admin account.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Unable to load complaints.');
      }
    } finally {
      if (shouldSetLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void reload({ silent: true });
    }, 5000);

    return () => window.clearInterval(interval);
  }, [reload]);

  useEffect(() => {
    console.log('Updated complaints:', complaints);
  }, [complaints]);

  const updateComplaintStatus = useCallback(async (complaint: Complaint, status: ManagedComplaintStatus) => {
    try {
      setUpdatingId(complaint.trackingId);
      const updated = await adminService.updateComplaintStatus(complaint, status);
      setComplaints((current) =>
        (Array.isArray(current) ? current : []).map((item) =>
          item.trackingId === complaint.trackingId
            ? {
                ...item,
                status: updated.status
              }
            : item
        )
      );
      toast.success(`Complaint ${complaint.trackingId} updated.`);
      return updated;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update status.');
      throw error;
    } finally {
      setUpdatingId(null);
    }
  }, []);

  return {
    complaints,
    loading,
    reload,
    setComplaints,
    updateComplaintStatus,
    updatingId
  };
}