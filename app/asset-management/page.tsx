"use client";

import { useEffect, useState, useMemo } from "react";
import { Smartphone, CheckCircle, Building2, Tag, TrendingUp, ArrowUpRight, Warehouse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend } from "recharts";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { useAssetDashboard } from "@/hooks/use-asset-dashboard";
import { DashboardSkeleton } from "@/components/ui/skeleton";

const CHART_COLORS = {
  active: "#22c55e",      // Green for active status
  inactive: "#ef4444",     // Red for inactive status
  primary: "#22c55e",      // Primary green color (same as active for consistency)
  secondary: "#3b82f6",    // Blue for secondary data
  accent: "#8b5cf6",      // Purple for accent
};

export default function AssetManagementDashboardPage() {
  // Get operator ID from localStorage
  const [operatorId, setOperatorId] = useState<string>();
  
  useEffect(() => {
    // Use requestAnimationFrame for smoother initial load
    requestAnimationFrame(() => {
      const operatorStr = localStorage.getItem("operator");
      if (operatorStr) {
        const operator = JSON.parse(operatorStr);
        setOperatorId(operator.id);
      }
    });
  }, []);

  // Use React Query hook for automatic caching & refetching
  const { data: rawData, isLoading: loading, error } = useAssetDashboard(operatorId);

  // Transform data with memoization for performance
  const data = useMemo(() => {
    if (!rawData) {
      return {
        kpis: {
          totalDevices: 0,
          totalBrands: 0,
          totalActiveStatus: 0,
          totalDepartments: 0,
        },
        charts: {
          activeInactiveByDevice: [] as Array<{ name: string; active: number; inactive: number }>,
          usedByDepartment: [] as Array<{ name: string; count: number }>,
          totalActiveByBrand: [] as Array<{ name: string; count: number }>,
          totalByStorageArea: [] as Array<{ name: string; count: number }>,
        },
      };
    }
    return rawData;
  }, [rawData]);

  // Memoize KPI cards to prevent unnecessary re-renders
  const kpiCards = useMemo<Array<{
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    trend: { value: number } | null;
  }>>(() => [
    {
      title: "Total Devices",
      value: data.kpis.totalDevices,
      icon: Smartphone,
      color: "text-primary",
      bgColor: "bg-primary/5",
      trend: null,
    },
    {
      title: "Total Brands",
      value: data.kpis.totalBrands,
      icon: Tag,
      color: "text-primary",
      bgColor: "bg-primary/5",
      trend: null,
    },
    {
      title: "Total Active Status",
      value: data.kpis.totalActiveStatus,
      icon: CheckCircle,
      color: "text-primary",
      bgColor: "bg-primary/5",
      trend: null,
    },
    {
      title: "Total Department",
      value: data.kpis.totalDepartments,
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/5",
      trend: null,
    },
  ], [data.kpis]);

  if (loading) {
    return (
      <PermissionGuard menuName="Dashboard">
        <DashboardSkeleton />
      </PermissionGuard>
    );
  }

  if (error || !data) {
    return (
      <PermissionGuard menuName="Dashboard">
        <div className="space-y-6 p-1">
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <p className="text-muted-foreground">Failed to load dashboard data</p>
            </div>
          </div>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard menuName="Dashboard">
      <div className="space-y-6 p-1">
        {/* KPI Cards - Modern Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <Card 
                key={index} 
                className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden group"
                style={{ 
                  animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`${kpi.bgColor} p-2.5 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-5 w-5 ${kpi.color}`} />
                    </div>
                    {kpi.trend && (
                      <div className="flex items-center gap-1 text-xs text-primary font-medium">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>{kpi.trend.value}%</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {kpi.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {kpi.value.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Active/Inactive Device per Device - Grouped Bar Chart */}
          <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden">
            <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-card px-6 py-4">
              <CardTitle className="text-foreground flex items-center gap-2 text-lg font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <div className="p-2 bg-primary/5 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                Active/Inactive Device per Device
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              {data.charts.activeInactiveByDevice.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.charts.activeInactiveByDevice}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
                      stroke="hsl(var(--border))"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                      stroke="hsl(var(--border))"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                    />
                    <Legend />
                    <Bar dataKey="active" fill={CHART_COLORS.active} radius={[8, 8, 0, 0]} name="Active">
                      <LabelList 
                        dataKey="active" 
                        position="top" 
                        style={{ fill: 'hsl(var(--foreground))', fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: '600' }}
                      />
                    </Bar>
                    <Bar dataKey="inactive" fill={CHART_COLORS.inactive} radius={[8, 8, 0, 0]} name="Inactive">
                      <LabelList 
                        dataKey="inactive" 
                        position="top" 
                        style={{ fill: 'hsl(var(--foreground))', fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: '600' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[320px] text-muted-foreground">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/5 dark:bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>No data available</p>
                    <p className="text-xs text-muted-foreground mt-1">Data will appear here once available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Used Device Per Department - Bar Chart */}
          <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden">
            <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-card px-6 py-4">
              <CardTitle className="text-foreground flex items-center gap-2 text-lg font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <div className="p-2 bg-primary/5 rounded-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                Used Device Per Department
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              {data.charts.usedByDepartment.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.charts.usedByDepartment}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                      stroke="hsl(var(--border))"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                      stroke="hsl(var(--border))"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                    />
                    <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]}>
                      <LabelList 
                        dataKey="count" 
                        position="top" 
                        style={{ fill: 'hsl(var(--foreground))', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: '600' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[320px] text-muted-foreground">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/5 dark:bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>No data available</p>
                    <p className="text-xs text-muted-foreground mt-1">Data will appear here once available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Total Active Per Brand - Bar Chart */}
          <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden">
            <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-card px-6 py-4">
              <CardTitle className="text-foreground flex items-center gap-2 text-lg font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <div className="p-2 bg-primary/5 rounded-lg">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
                Total Active Per Brand
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              {data.charts.totalActiveByBrand.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.charts.totalActiveByBrand}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                      stroke="hsl(var(--border))"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                      stroke="hsl(var(--border))"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                    />
                    <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]}>
                      <LabelList 
                        dataKey="count" 
                        position="top" 
                        style={{ fill: 'hsl(var(--foreground))', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: '600' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[320px] text-muted-foreground">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/5 dark:bg-primary/10 flex items-center justify-center">
                      <Tag className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>No data available</p>
                    <p className="text-xs text-muted-foreground mt-1">Data will appear here once available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Device Used On Storage Area - Bar Chart */}
          <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden">
            <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-card px-6 py-4">
              <CardTitle className="text-foreground flex items-center gap-2 text-lg font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <div className="p-2 bg-primary/5 rounded-lg">
                  <Warehouse className="h-5 w-5 text-primary" />
                </div>
                Total Device Used On Storage Area
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              {data.charts.totalByStorageArea.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.charts.totalByStorageArea}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                      stroke="hsl(var(--border))"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                      stroke="hsl(var(--border))"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                    />
                    <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]}>
                      <LabelList 
                        dataKey="count" 
                        position="top" 
                        style={{ fill: 'hsl(var(--foreground))', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: '600' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[320px] text-muted-foreground">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/5 dark:bg-primary/10 flex items-center justify-center">
                      <Warehouse className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>No data available</p>
                    <p className="text-xs text-muted-foreground mt-1">Data will appear here once available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
}
