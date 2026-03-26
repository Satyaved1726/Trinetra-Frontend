import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/useAuth';
import { adminService, type AdminAnalyticsResponse } from '@/services/adminService';
import type { Complaint } from '@/types/complaint';

const AUTO_REFRESH_MS = 300000;

const emptyAnalytics: AdminAnalyticsResponse = {
  totalComplaints: 0,
  openComplaints: 0,
  resolvedComplaints: 0,
  rejectedComplaints: 0,
  anonymousComplaints: 0,
  identifiedComplaints: 0,
  complaintsOverTime: [],
  complaintsByCategory: [],
  complaintsByStatus: []
};

export const adminQueryKeys = {
  complaints: ['admin', 'complaints'] as const,
  analytics: ['admin', 'analytics'] as const,
  reports: ['admin', 'reports', 'all'] as const
};

function formatLastUpdatedText(timestamp: number): string {
  if (!timestamp) return 'Last updated: never';

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes === 0) return 'Last updated: just now';
  if (minutes === 1) return 'Last updated: 1 minute ago';
  return `Last updated: ${minutes} minutes ago`;
}

export function useAdminDashboardData() {
  const { isAdmin, isAuthenticated } = useAuth();
  const enabled = isAuthenticated && isAdmin;

  const [complaintsQuery, analyticsQuery, reportsQuery] = useQueries({
    queries: [
      {
        queryKey: adminQueryKeys.complaints,
        queryFn: () => adminService.getAllComplaints(),
        enabled,
        retry: 1,
        staleTime: 5 * 60 * 1000
      },
      {
        queryKey: adminQueryKeys.analytics,
        queryFn: () => adminService.getAnalytics(),
        enabled,
        retry: 1,
        staleTime: 5 * 60 * 1000
      },
      {
        queryKey: adminQueryKeys.reports,
        queryFn: () => adminService.getReports(),
        enabled,
        retry: 1,
        staleTime: 5 * 60 * 1000
      }
    ]
  });

  return {
    complaints: (complaintsQuery.data as Complaint[] | undefined) ?? [],
    analytics: analyticsQuery.data ?? emptyAnalytics,
    reports: (reportsQuery.data as Complaint[] | undefined) ?? [],
    isLoading: complaintsQuery.isLoading || analyticsQuery.isLoading || reportsQuery.isLoading,
    isFetching: complaintsQuery.isFetching || analyticsQuery.isFetching || reportsQuery.isFetching,
    hasError: Boolean(complaintsQuery.error || analyticsQuery.error || reportsQuery.error)
  };
}

export function useAdminSmartRefresh() {
  const queryClient = useQueryClient();
  const { isAdmin, isAuthenticated } = useAuth();
  const enabled = isAuthenticated && isAdmin;
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  const dashboardData = useAdminDashboardData();

  useEffect(() => {
    if (dashboardData.hasError) {
      toast.error('Failed to load dashboard data');
    }
  }, [dashboardData.hasError]);

  const refreshAll = useCallback(async (options?: { silent?: boolean }) => {
    if (!enabled) return;

    setIsManualRefreshing(true);

    try {
      await Promise.all([
        queryClient.fetchQuery({
          queryKey: adminQueryKeys.complaints,
          queryFn: () => adminService.getAllComplaints(),
          staleTime: 0,
          retry: 1
        }),
        queryClient.fetchQuery({
          queryKey: adminQueryKeys.analytics,
          queryFn: () => adminService.getAnalytics(),
          staleTime: 0,
          retry: 1
        }),
        queryClient.fetchQuery({
          queryKey: adminQueryKeys.reports,
          queryFn: () => adminService.getReports(),
          staleTime: 0,
          retry: 1
        })
      ]);

      if (!options?.silent) {
        toast.success('Data refreshed successfully');
      }
    } catch (error) {
      if (!options?.silent) {
        toast.error('Failed to refresh dashboard data');
      }
      throw error;
    } finally {
      setIsManualRefreshing(false);
      setTick((value) => value + 1);
    }
  }, [enabled, queryClient]);

  useEffect(() => {
    if (!enabled) return;

    const handle = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshAll({ silent: true });
      }
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(handle);
  }, [enabled, refreshAll]);

  useEffect(() => {
    const handle = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 60000);

    return () => window.clearInterval(handle);
  }, []);

  const lastUpdatedAt = useMemo(() => {
    const timestamps = [
      queryClient.getQueryState(adminQueryKeys.complaints)?.dataUpdatedAt ?? 0,
      queryClient.getQueryState(adminQueryKeys.analytics)?.dataUpdatedAt ?? 0,
      queryClient.getQueryState(adminQueryKeys.reports)?.dataUpdatedAt ?? 0
    ];

    return Math.max(...timestamps);
  }, [queryClient, isManualRefreshing, tick]);

  return {
    refreshAll,
    isManualRefreshing,
    lastUpdatedText: formatLastUpdatedText(lastUpdatedAt)
  };
}
