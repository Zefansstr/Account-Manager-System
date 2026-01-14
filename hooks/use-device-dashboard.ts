/**
 * React Query Hook for Device Management Dashboard Stats
 * Provides automatic caching and refresh for device dashboard data
 */

import { useQuery } from '@tanstack/react-query';

// Device Dashboard stats types
export interface DeviceDashboardKPIs {
  totalDevices: number;
  activeDevices: number;
  totalTypes: number;
  totalBrands: number;
}

export interface ChartData {
  name: string;
  count: number;
  [key: string]: any; // Allow additional properties for Recharts compatibility
}

export interface DeviceDashboardCharts {
  devicesStatus: ChartData[];
  devicesByType: ChartData[];
  devicesByBrand: ChartData[];
  devicesByUserUse: ChartData[];
}

export interface DeviceDashboardData {
  kpis: DeviceDashboardKPIs;
  charts: DeviceDashboardCharts;
}

// Fetch device dashboard stats
async function fetchDeviceDashboardStats(operatorId?: string): Promise<DeviceDashboardData> {
  const headers: HeadersInit = {};
  if (operatorId) {
    headers["X-Operator-Id"] = operatorId;
  }

  const res = await fetch('/api/device-management/dashboard/stats', { headers });
  if (!res.ok) throw new Error('Failed to fetch device dashboard stats');
  return res.json();
}

// Hook: Get device dashboard stats with caching
export function useDeviceDashboard(operatorId?: string) {
  return useQuery<DeviceDashboardData>({
    queryKey: ['device-dashboard', 'stats', operatorId],
    queryFn: () => fetchDeviceDashboardStats(operatorId),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });
}
