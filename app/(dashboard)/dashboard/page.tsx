"use client";

import { useMemo } from "react";
import { Users, UserCheck, AppWindow, Layers, Building2, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, PieChart, Pie, Cell } from "recharts";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { getDepartmentDisplayName, getRoleDisplayName } from "@/lib/display-names";
import { useDashboard } from "@/hooks/use-dashboard";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { useOperatorId } from "@/lib/operator-store";
import { useTheme } from "@/components/providers/theme-provider";

const STATUS_COLORS = {
  Active: "#34d399",   // hijau halus
  Inactive: "#f87171", // merah halus
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

/** Tooltip dark — sama dengan frame content abu-abu halus. */
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

/** Palet warna chart — variasi agar tidak full coklat; tetap selaras tema. */
const CHART_PALETTE = [
  "#7f5539",   // primary brown
  "#0d9488",   // teal
  "#a06540",   // brown light
  "#64748b",   // slate
  "#c4a77d",   // tan
  "#0891b2",   // cyan
  "#6b4730",   // brown dark
  "#6366f1",   // indigo
] as const;

const CHART_THEME = {
  brown: "#7f5539",
  brownLight: "#a06540",
  beige: "#e8e0d5",
  beigePanel: "#ece2d9",
  brownMuted: "rgba(127, 85, 57, 0.6)",
  gridStroke: "rgba(232, 224, 213, 0.8)",
  axisStroke: "#5d5d5d",
  tooltipBg: "#1a1a1a",
  tooltipBorder: "#404040",
  tooltipText: "#f5f5f5",
  /** Gradient & fill untuk single-series (tetap satu warna tema). */
  barGradient: { start: "#7f5539", end: "#e8e0d5" },
  /** Warna per-seri untuk chart multi-series (mix & match dengan tema). */
  palette: CHART_PALETTE,
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, count }: any) => {
  const radius = outerRadius + 25;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const segmentColor = STATUS_COLORS[name as keyof typeof STATUS_COLORS] ?? "#5d5d5d";

  return (
    <g>
      <text
        x={x}
        y={y - 8}
        fill="hsl(var(--foreground))"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize="14"
        fontWeight="600"
        fontFamily="Inter, sans-serif"
      >
        {name}
      </text>
      <text
        x={x}
        y={y + 8}
        fill={segmentColor}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="500"
        fontFamily="Inter, sans-serif"
      >
        count : {count}
      </text>
    </g>
  );
};

export default function DashboardPage() {
  const { theme } = useTheme();
  const operatorId = useOperatorId();
  const tooltipStyle = theme === "dark" ? TOOLTIP_STYLE_DARK : TOOLTIP_STYLE_LIGHT;

  // Use React Query hook for automatic caching & refetching (no waterfall: operatorId ready on first render)
  const { data: rawData, isLoading: loading, error } = useDashboard(operatorId);

  // Transform data with display names (memoized for performance)
  const data = useMemo(() => {
    if (!rawData) return null;

    return {
      kpis: rawData.kpis,
      charts: {
        accountsStatus: rawData.charts.accountsStatus,
        accountsByDepartment: rawData.charts.accountsByDepartment.map(item => ({
          ...item,
          name: getDepartmentDisplayName(item.name),
        })),
        accountsByApplication: rawData.charts.accountsByApplication,
        accountsByRole: rawData.charts.accountsByRole.map(item => ({
          ...item,
          name: getRoleDisplayName(item.name),
        })),
      },
    };
  }, [rawData]);

  if (loading) {
    return (
      <PermissionGuard menuName="Dashboard">
        <DashboardSkeleton />
      </PermissionGuard>
    );
  }

  if (error) {
    return (
      <PermissionGuard menuName="Dashboard">
        <div className="flex items-center justify-center h-96">
          <div className="text-destructive">Failed to load dashboard data: {error.message}</div>
        </div>
      </PermissionGuard>
    );
  }

  if (!data) {
    return (
      <PermissionGuard menuName="Dashboard">
        <div className="flex items-center justify-center h-96">
          <div className="text-destructive">No data available</div>
        </div>
      </PermissionGuard>
    );
  }

  const kpiCards = [
    {
      title: "Total Account",
      value: data.kpis.totalAccounts,
      icon: Users,
      color: "text-[#7f5539]",
    },
    {
      title: "Active Account",
      value: data.kpis.activeAccounts,
      icon: UserCheck,
      color: "text-[#7f5539]",
    },
    {
      title: "Total Applications",
      value: data.kpis.totalApplications,
      icon: AppWindow,
      color: "text-[#7f5539]",
    },
    {
      title: "Total Departments",
      value: data.kpis.totalDepartments,
      icon: Building2,
      color: "text-[#7f5539]",
    },
  ];

  return (
    <PermissionGuard menuName="dashboard">
      <div className="space-y-4 rounded-2xl bg-[#e8e0d5]/30 dark:bg-[#101211] border border-[#e8e0d5] dark:border-[#1f1f1f] p-6">
      {/* KPI Cards - Single Row */}
      <div className="grid grid-cols-4 gap-3">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="border-[#e8e0d5]/80 dark:border-[#1f1f1f] bg-white dark:bg-[#101211]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-[#1e1e1e] dark:text-gray-200">
                  {kpi.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#1e1e1e] dark:text-white">{kpi.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Active vs Inactive Accounts - Donut Chart */}
        <Card className="border-[#e8e0d5]/80 dark:border-[#1f1f1f] bg-white dark:bg-[#101211] shadow-sm">
          <CardHeader className="border-b border-[#e8e0d5] dark:border-[#1f1f1f]">
            <CardTitle className="text-[#1e1e1e] dark:text-gray-200 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-[#7f5539]" />
              Active vs Inactive Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {data.charts.accountsStatus.length > 0 ? (
              <div className="space-y-2">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={data.charts.accountsStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={{ stroke: "#5d5d5d", strokeWidth: 2 }}
                      label={renderCustomizedLabel}
                      outerRadius={95}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="count"
                      paddingAngle={2}
                    >
                      {data.charts.accountsStatus.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]}
                          strokeWidth={theme === "dark" ? 0 : 2}
                          stroke={theme === "dark" ? "none" : "#ece2d9"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle.contentStyle}
                      itemStyle={tooltipStyle.itemStyle}
                      labelStyle={tooltipStyle.labelStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend - Raised Position */}
                <div className="grid grid-cols-2 gap-2 -mt-2">
                  {data.charts.accountsStatus.map((entry, index) => {
                    const color = STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS];
                    return (
                      <div key={index} className="flex items-center gap-2 bg-[#e8e0d5]/60 dark:bg-[#1a1a1a] rounded px-3 py-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-sm text-[#1e1e1e] dark:text-gray-300 font-medium">{entry.name}</span>
                        <span className="ml-auto text-sm font-bold" style={{ color }}>{entry.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[320px] text-[#5d5d5d]">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accounts by Department - Bar Chart */}
        <Card className="border-[#e8e0d5]/80 dark:border-[#1f1f1f] bg-white dark:bg-[#101211] shadow-sm">
          <CardHeader className="border-b border-[#e8e0d5] dark:border-[#1f1f1f]">
            <CardTitle className="text-[#1e1e1e] dark:text-gray-200 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#7f5539]" />
              Total Accounts by Departments
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {data.charts.accountsByDepartment.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.charts.accountsByDepartment} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridStroke} opacity={0.6} />
                  <XAxis
                    dataKey="name"
                    stroke={CHART_THEME.axisStroke}
                    tick={{ fill: CHART_THEME.axisStroke, fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke={CHART_THEME.axisStroke} 
                    tick={{ fill: CHART_THEME.axisStroke, fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(232, 224, 213, 0.5)" }}
                    contentStyle={tooltipStyle.contentStyle}
                    itemStyle={tooltipStyle.itemStyle}
                    labelStyle={tooltipStyle.labelStyle}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    {data.charts.accountsByDepartment.map((_, index) => (
                      <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                    ))}
                    <LabelList dataKey="count" position="top" fill={CHART_THEME.axisStroke} fontWeight="600" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[320px] text-[#5d5d5d]">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Accounts by Application - Bar Chart */}
        <Card className="border-[#e8e0d5]/80 dark:border-[#1f1f1f] bg-white dark:bg-[#101211] shadow-sm">
          <CardHeader className="border-b border-[#e8e0d5] dark:border-[#1f1f1f]">
            <CardTitle className="text-[#1e1e1e] dark:text-gray-200 flex items-center gap-2">
              <AppWindow className="h-5 w-5 text-[#7f5539]" />
              Total Accounts by Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {data.charts.accountsByApplication.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.charts.accountsByApplication} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridStroke} opacity={0.6} />
                  <XAxis
                    dataKey="name"
                    stroke={CHART_THEME.axisStroke}
                    tick={{ fill: CHART_THEME.axisStroke, fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke={CHART_THEME.axisStroke} 
                    tick={{ fill: CHART_THEME.axisStroke, fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(232, 224, 213, 0.5)" }}
                    contentStyle={tooltipStyle.contentStyle}
                    itemStyle={tooltipStyle.itemStyle}
                    labelStyle={tooltipStyle.labelStyle}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    {data.charts.accountsByApplication.map((_, index) => (
                      <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                    ))}
                    <LabelList dataKey="count" position="top" fill={CHART_THEME.axisStroke} fontWeight="600" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[320px] text-[#5d5d5d]">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accounts by Role - Bar Chart */}
        <Card className="border-[#e8e0d5]/80 dark:border-[#1f1f1f] bg-white dark:bg-[#101211] shadow-sm">
          <CardHeader className="border-b border-[#e8e0d5] dark:border-[#1f1f1f]">
            <CardTitle className="text-[#1e1e1e] dark:text-gray-200 flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#7f5539]" />
              Total Accounts by Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {data.charts.accountsByRole.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.charts.accountsByRole} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridStroke} opacity={0.6} />
                  <XAxis
                    dataKey="name"
                    stroke={CHART_THEME.axisStroke}
                    tick={{ fill: CHART_THEME.axisStroke, fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke={CHART_THEME.axisStroke} 
                    tick={{ fill: CHART_THEME.axisStroke, fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(232, 224, 213, 0.5)" }}
                    contentStyle={tooltipStyle.contentStyle}
                    itemStyle={tooltipStyle.itemStyle}
                    labelStyle={tooltipStyle.labelStyle}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    {data.charts.accountsByRole.map((_, index) => (
                      <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                    ))}
                    <LabelList dataKey="count" position="top" fill={CHART_THEME.axisStroke} fontWeight="600" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[320px] text-[#5d5d5d]">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </PermissionGuard>
  );
}
