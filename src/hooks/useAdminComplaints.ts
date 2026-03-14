import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { adminService } from '@/services/adminService';
import { ApiError } from '@/services/httpClient';
import type { Complaint, ManagedComplaintStatus } from '@/types/complaint';

export function useAdminComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllComplaints();
      setComplaints(response);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        toast.error('Admin access denied for complaints API. Please login with an admin account.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Unable to load complaints.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateComplaintStatus = useCallback(async (complaint: Complaint, status: ManagedComplaintStatus) => {
    try {
      setUpdatingId(complaint.trackingId);
      const updated = await adminService.updateComplaintStatus(complaint, status);
      setComplaints((current) =>
        current.map((item) =>
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