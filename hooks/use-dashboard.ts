/**
 * React Query Hook for Dashboard Stats
 * Provides automatic caching and refresh for dashboard data
 */

import { useQuery } from '@tanstack/react-query';

// Dashboard stats types
export interface DashboardKPIs {
  totalAccounts: number;
  activeAccounts: number;
  totalApplications: number;
  totalLines: number;
  totalDepartments: number;
  totalRoles: number;
}

export interface ChartData {
  name: string;
  count: number;
}

export interface DashboardCharts {
  accountsStatus: ChartData[];
  accountsByDepartment: ChartData[];
  accountsByApplication: ChartData[];
  accountsByRole: ChartData[];
}

export interface DashboardData {
  kpis: DashboardKPIs;
  charts: DashboardCharts;
}

// Fetch dashboard stats
async function fetchDashboardStats(operatorId?: string): Promise<DashboardData> {
  const headers: HeadersInit = {};
  if (operatorId) {
    headers["X-Operator-Id"] = operatorId;
  }

  const res = await fetch('/api/dashboard/stats', { headers });
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

// Hook: Get dashboard stats with caching
export function useDashboard(operatorId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'stats', operatorId],
    queryFn: () => fetchDashboardStats(operatorId),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });
}
