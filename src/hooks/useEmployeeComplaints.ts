import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { complaintsApi } from '@/services/api';
import type { Complaint } from '@/types/complaint';

export function useEmployeeComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const response = await complaintsApi.getMyComplaints();
      setComplaints(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load your complaints.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    complaints,
    loading,
    reload,
    setComplaints
  };
}
