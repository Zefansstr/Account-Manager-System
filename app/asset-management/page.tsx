"use client";

import { useEffect, useState, useMemo } from "react";
import { Smartphone, CheckCircle, Building2, Tag, Warehouse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend, Cell } from "recharts";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { useAssetDashboard } from "@/hooks/use-asset-dashboard";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/providers/theme-provider";

const STATUS_COLORS = {
  active: "#34d399",
  inactive: "#f87171",
};

/** Tooltip light — sama dengan background main layout (beige #e8e0d5). */
const TOOLTIP_STYLE_LIGHT = {
  contentStyle: {
    backgroundColor: "#e8e0d5",
    border: "1px solid rgba(127, 85, 57, 0.2)",
    borderRadius: "10px",
    padding: "14px 16px",
    boxShadow: "0 8px 24px rgba(127, 85, 57, 0.1)",
  },
  itemStyle: { color: "#1e1e1e", fontWeight: "600", fontSize: "13px" },
  labelStyle: { color: "#1e1e1e", fontWeight: "600", fontSize: "13px" },
};

const TOOLTIP_STYLE_DARK = {
  contentStyle: {
    backgroundColor: "#1a1a1a",
    border: "1px solid #2d2d2d",
    borderRadius: "10px",
    padding: "14px 16px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
  },
  itemStyle: { color: "#e5e5e5", fontWeight: "600", fontSize: "13px" },
  labelStyle: { color: "#d4d4d4", fontWeight: "600", fontSize: "13px" },
};

const CHART_PALETTE = [
  "#7f5539", "#0d9488", "#a06540", "#64748b", "#c4a77d", "#0891b2", "#6b4730", "#6366f1",
] as const;

const CHART_THEME = {
  gridStroke: "rgba(232, 224, 213, 0.8)",
  axisStroke: "#5d5d5d",
};

export default function AssetManagementDashboardPage() {
  const { theme } = useTheme();
  const tooltipStyle = theme === "dark" ? TOOLTIP_STYLE_DARK : TOOLTIP_STYLE_LIGHT;
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

  const kpiCards = useMemo<Array<{
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
  }>>(() => [
    { title: "Total Devices", value: data.kpis.totalDevices, icon: Smartphone },
    { title: "Total Brands", value: data.kpis.totalBrands, icon: Tag },
    { title: "Total Active Status", value: data.kpis.totalActiveStatus, icon: CheckCircle },
    { title: "Total Department", value: data.kpis.totalDepartments, icon: Building2 },
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
        <div className="flex items-center justify-center h-96">
          <div className="text-destructive">Failed to load dashboard data</div>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard menuName="Dashboard">
      <div className="space-y-4 rounded-2xl bg-[#e8e0d5]/30 dark:bg-[#101211] border border-[#e8e0d5] dark:border-[#1f1f1f] p-6">
        <div className="grid grid-cols-4 gap-3">
          {kpiCards.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <Card key={index} className="border-[#e8e0d5]/80 dark:border-[#1f1f1f] bg-white dark:bg-[#101211]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium text-[#1e1e1e] dark:text-gray-200">
                    {kpi.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-[#7f5539]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#1e1e1e] dark:text-white">{kpi.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-[#e8e0d5]/80 dark:border-[#1f1f1f] bg-white dark:bg-[#101211] shadow-sm">
            <CardHeader className="border-b border-[#e8e0d5] dark:border-[#1f1f1f]">
              <CardTitle className="text-[#1e1e1e] dark:text-gray-200 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#7f5539]" />
                Active/Inactive Device per Device
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {data.charts.activeInactiveByDevice.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.charts.activeInactiveByDevice} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridStroke} opacity={0.6} />
                    <XAxis dataKey="name" stroke={CHART_THEME.axisStroke} tick={{ fill: CHART_THEME.axisStroke, fontSize: 12 }} tickLine={false} />
                    <YAxis stroke={CHART_THEME.axisStroke} tick={{ fill: CHART_THEME.axisStroke, fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "rgba(232, 224, 213, 0.5)" }} contentStyle={tooltipStyle.contentStyle} itemStyle={tooltipStyle.itemStyle} labelStyle={tooltipStyle.labelStyle} />
                    <Legend />
                    <Bar dataKey="active" fill={STATUS_COLORS.active} radius={[8, 8, 0, 0]} name="Active">
                      <LabelList dataKey="active" position="top" fill={CHART_THEME.axisStroke} fontWeight="600" />
                    </Bar>
                    <Bar dataKey="inactive" fill={STATUS_COLORS.inactive} radius={[8, 8, 0, 0]} name="Inactive">
                      <LabelList dataKey="inactive" position="top" fill={CHART_THEME.axisStroke} fontWeight="600" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[320px] text-[#5d5d5d]">No data available</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#e8e0d5]/80 dark:border-[#1f1f1f] bg-white dark:bg-[#101211] shadow-sm">
            <CardHeader className="border-b border-[#e8e0d5] dark:border-[#1f1f1f]">
              <CardTitle className="text-[#1e1e1e] dark:text-gray-200 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#7f5539]" />
                Used Device Per Department
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {data.charts.usedByDepartment.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.charts.usedByDepartment} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridStroke} opacity={0.6} />
                    <XAxis dataKey="name" stroke={CHART_THEME.axisStroke} tick={{ fill: CHART_THEME.axisStroke, fontSize: 12 }} tickLine={false} />
                    <YAxis stroke={CHART_THEME.axisStroke} tick={{ fill: CHART_THEME.axisStroke, fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "rgba(232, 224, 213, 0.5)" }} contentStyle={tooltipStyle.contentStyle} itemStyle={tooltipStyle.itemStyle} labelStyle={tooltipStyle.labelStyle} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={60}>
                      {data.charts.usedByDepartment.map((_, index) => (
                        <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                      ))}
                      <LabelList dataKey="count" position="top" fill={CHART_THEME.axisStroke} fontWeight="600" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[320px] text-[#5d5d5d]">No data available</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-[#e8e0d5]/80 dark:border-[#1f1f1f] bg-white dark:bg-[#101211] shadow-sm">
            <CardHeader className="border-b border-[#e8e0d5] dark:border-[#1f1f1f]">
              <CardTitle className="text-[#1e1e1e] dark:text-gray-200 flex items-center gap-2">
                <Tag className="h-5 w-5 text-[#7f5539]" />
                Total Active Per Brand
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {data.charts.totalActiveByBrand.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.charts.totalActiveByBrand} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridStroke} opacity={0.6} />
                    <XAxis dataKey="name" stroke={CHART_THEME.axisStroke} tick={{ fill: CHART_THEME.axisStroke, fontSize: 12 }} tickLine={false} />
                    <YAxis stroke={CHART_THEME.axisStroke} tick={{ fill: CHART_THEME.axisStroke, fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "rgba(232, 224, 213, 0.5)" }} contentStyle={tooltipStyle.contentStyle} itemStyle={tooltipStyle.itemStyle} labelStyle={tooltipStyle.labelStyle} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={60}>
                      {data.charts.totalActiveByBrand.map((_, index) => (
                        <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                      ))}
                      <LabelList dataKey="count" position="top" fill={CHART_THEME.axisStroke} fontWeight="600" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[320px] text-[#5d5d5d]">No data available</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#e8e0d5]/80 dark:border-[#1f1f1f] bg-white dark:bg-[#101211] shadow-sm">
            <CardHeader className="border-b border-[#e8e0d5] dark:border-[#1f1f1f]">
              <CardTitle className="text-[#1e1e1e] dark:text-gray-200 flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-[#7f5539]" />
                Total Device Used On Storage Area
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {data.charts.totalByStorageArea.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.charts.totalByStorageArea} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridStroke} opacity={0.6} />
                    <XAxis dataKey="name" stroke={CHART_THEME.axisStroke} tick={{ fill: CHART_THEME.axisStroke, fontSize: 12 }} tickLine={false} />
                    <YAxis stroke={CHART_THEME.axisStroke} tick={{ fill: CHART_THEME.axisStroke, fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "rgba(232, 224, 213, 0.5)" }} contentStyle={tooltipStyle.contentStyle} itemStyle={tooltipStyle.itemStyle} labelStyle={tooltipStyle.labelStyle} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={60}>
                      {data.charts.totalByStorageArea.map((_, index) => (
                        <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                      ))}
                      <LabelList dataKey="count" position="top" fill={CHART_THEME.axisStroke} fontWeight="600" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[320px] text-[#5d5d5d]">No data available</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
}
