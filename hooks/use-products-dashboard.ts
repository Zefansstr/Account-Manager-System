/**
 * React Query Hook for Products Dashboard Stats
 * Provides automatic caching and refresh for products dashboard data
 */

import { useQuery } from '@tanstack/react-query';

// Dashboard stats types (same as use-dashboard)
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
  [key: string]: any; // Allow additional properties for Recharts compatibility
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

// Fetch products dashboard stats
async function fetchProductsDashboardStats(operatorId?: string): Promise<DashboardData> {
  const headers: HeadersInit = {};
  if (operatorId) {
    headers["X-Operator-Id"] = operatorId;
  }

  const res = await fetch('/api/products/dashboard/stats', { headers });
  if (!res.ok) throw new Error('Failed to fetch products dashboard stats');
  return res.json();
}

// Hook: Get products dashboard stats with caching
export function useProductsDashboard(operatorId?: string) {
  return useQuery<DashboardData>({
    queryKey: ['products-dashboard', 'stats', operatorId],
    queryFn: () => fetchProductsDashboardStats(operatorId),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });
}

