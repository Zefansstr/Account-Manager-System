/**
 * React Query Hook for Asset Management Dashboard Stats
 * Provides automatic caching and refresh for asset dashboard data
 */

import { useQuery } from '@tanstack/react-query';

// Asset Dashboard stats types
export interface AssetDashboardKPIs {
  totalAssets: number;
  activeAssets: number;
  totalTypes: number;
  totalBrands: number;
}

export interface ChartData {
  name: string;
  count: number;
  [key: string]: any; // Allow additional properties for Recharts compatibility
}

export interface AssetDashboardCharts {
  assetsStatus: ChartData[];
  assetsByType: ChartData[];
  assetsByBrand: ChartData[];
  assetsByUserUse: ChartData[];
}

export interface AssetDashboardData {
  kpis: AssetDashboardKPIs;
  charts: AssetDashboardCharts;
}

// Fetch asset dashboard stats
async function fetchAssetDashboardStats(operatorId?: string): Promise<AssetDashboardData> {
  const headers: HeadersInit = {};
  if (operatorId) {
    headers["X-Operator-Id"] = operatorId;
  }

  const res = await fetch('/api/asset-management/dashboard/stats', { headers });
  if (!res.ok) throw new Error('Failed to fetch asset dashboard stats');
  return res.json();
}

// Hook: Get asset dashboard stats with caching
export function useAssetDashboard(operatorId?: string) {
  return useQuery<AssetDashboardData>({
    queryKey: ['asset-dashboard', 'stats', operatorId],
    queryFn: () => fetchAssetDashboardStats(operatorId),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });
}
