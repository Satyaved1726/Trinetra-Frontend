import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { adminQueryKeys } from '@/hooks/useAdminDashboardData';
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
    content?: unknown;
    items?: unknown;
    results?: unknown;
  };

  if (Array.isArray(root.complaints)) return root.complaints as Complaint[];
  if (Array.isArray(root.data)) return root.data as Complaint[];
  if (Array.isArray(root.content)) return root.content as Complaint[];
  if (Array.isArray(root.items)) return root.items as Complaint[];
  if (Array.isArray(root.results)) return root.results as Complaint[];

  if (root.data && typeof root.data === 'object') {
    const nested = root.data as {
      complaints?: unknown;
      data?: unknown;
      content?: unknown;
      items?: unknown;
      results?: unknown;
    };

    if (Array.isArray(nested.complaints)) return nested.complaints as Complaint[];
    if (Array.isArray(nested.data)) return nested.data as Complaint[];
    if (Array.isArray(nested.content)) return nested.content as Complaint[];
    if (Array.isArray(nested.items)) return nested.items as Complaint[];
    if (Array.isArray(nested.results)) return nested.results as Complaint[];
  }

  return [];
}

export function useAdminComplaints() {
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const previousIdsRef = useRef<Set<string>>(new Set());

  const reload = useCallback(async (options?: { silent?: boolean }) => {
    try {
      const response = await queryClient.fetchQuery({
        queryKey: adminQueryKeys.complaints,
        queryFn: () => adminService.getAllComplaints(),
        staleTime: 0,
        retry: 1
      });

      const normalizedComplaints = normalizeComplaintsResponse(response as unknown);
      queryClient.setQueryData(adminQueryKeys.complaints, normalizedComplaints);

      if (!options?.silent) {
        toast.success('Data refreshed successfully');
      }

      return normalizedComplaints;
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        toast.error('Admin access denied for complaints API. Please login with an admin account.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Unable to load complaints.');
      }
      return [];
    }
  }, [queryClient]);

  const complaintsQuery = useQuery({
    queryKey: adminQueryKeys.complaints,
    queryFn: () => adminService.getAllComplaints(),
    retry: 1,
    staleTime: 5 * 60 * 1000
  });

  const complaints = useMemo(() => normalizeComplaintsResponse(complaintsQuery.data as unknown), [complaintsQuery.data]);

  useEffect(() => {
    if (!Array.isArray(complaints) || complaints.length === 0) return;

    const currentIds = new Set(
      complaints.map((item) => String(item.id ?? item.trackingId)).filter(Boolean)
    );

    if (previousIdsRef.current.size > 0) {
      const newItems = [...currentIds].filter((id) => !previousIdsRef.current.has(id));
      if (newItems.length > 0) {
        toast.info(newItems.length === 1 ? '1 new complaint arrived' : `${newItems.length} new complaints arrived`);
      }
    }

    previousIdsRef.current = currentIds;
  }, [complaints]);

  const updateComplaintStatus = useCallback(async (complaint: Complaint, status: ManagedComplaintStatus) => {
    try {
      setUpdatingId(complaint.trackingId);
      const updated = await adminService.updateComplaintStatus(complaint, status);

      queryClient.setQueryData<Complaint[]>(adminQueryKeys.complaints, (current = []) =>
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
  }, [queryClient]);

  return {
    complaints,
    loading: complaintsQuery.isLoading,
    reload,
    setComplaints: (value: Complaint[]) => queryClient.setQueryData(adminQueryKeys.complaints, value),
    updateComplaintStatus,
    updatingId
  };
}