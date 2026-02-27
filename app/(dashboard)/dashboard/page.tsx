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
  Active: "#7f5539",
  Inactive: "#9ca3af"
};

const CHART_THEME = {
  brown: "#7f5539",
  brownLight: "#a06540",
  beige: "#e8e0d5",
  beigePanel: "#ece2d9",
  brownMuted: "rgba(127, 85, 57, 0.6)",
  gridStroke: "rgba(232, 224, 213, 0.8)",
  axisStroke: "#5d5d5d",
  tooltipBg: "#ece2d9",
  tooltipBorder: "#7f5539",
  tooltipText: "#1e1e1e",
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, count }: any) => {
  const radius = outerRadius + 25; // Position label outside the donut
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <g>
      <text 
        x={x} 
        y={y - 8} 
        fill="hsl(var(--foreground))"
        textAnchor={x > cx ? 'start' : 'end'} 
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
        fill="#7f5539"
        textAnchor={x > cx ? 'start' : 'end'} 
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

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-destructive">Failed to load dashboard data</div>
      </div>
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
                      contentStyle={{
                        backgroundColor: CHART_THEME.tooltipBg,
                        border: `1px solid ${CHART_THEME.tooltipBorder}`,
                        borderRadius: "8px",
                        padding: "12px",
                        boxShadow: "0 4px 12px rgba(127, 85, 57, 0.12)",
                      }}
                      itemStyle={{ color: CHART_THEME.tooltipText, fontWeight: "600" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend - Raised Position */}
                <div className="grid grid-cols-2 gap-2 -mt-2">
                  {data.charts.accountsStatus.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 bg-[#e8e0d5]/60 dark:bg-[#1a1a1a] rounded px-3 py-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] }}
                      />
                      <span className="text-sm text-[#1e1e1e] dark:text-gray-300 font-medium">{entry.name}</span>
                      <span className="ml-auto text-sm font-bold text-[#7f5539]">{entry.count}</span>
                    </div>
                  ))}
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
                  <defs>
                    <linearGradient id="colorDept" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7f5539" stopOpacity={0.95}/>
                      <stop offset="95%" stopColor="#e8e0d5" stopOpacity={0.9}/>
                    </linearGradient>
                  </defs>
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
                    contentStyle={{
                      backgroundColor: CHART_THEME.tooltipBg,
                      border: `1px solid ${CHART_THEME.tooltipBorder}`,
                      borderRadius: "8px",
                      padding: "12px",
                      boxShadow: "0 4px 12px rgba(127, 85, 57, 0.12)",
                    }}
                    itemStyle={{ color: CHART_THEME.tooltipBorder, fontWeight: "600", fontSize: "14px" }}
                    labelStyle={{ color: CHART_THEME.tooltipText, fontWeight: "600" }}
                  />
                  <Bar dataKey="count" fill="url(#colorDept)" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    <LabelList dataKey="count" position="top" fill="#7f5539" fontWeight="600" />
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
                  <defs>
                    <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7f5539" stopOpacity={0.95}/>
                      <stop offset="95%" stopColor="#e8e0d5" stopOpacity={0.9}/>
                    </linearGradient>
                  </defs>
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
                    contentStyle={{
                      backgroundColor: CHART_THEME.tooltipBg,
                      border: `1px solid ${CHART_THEME.tooltipBorder}`,
                      borderRadius: "8px",
                      padding: "12px",
                      boxShadow: "0 4px 12px rgba(127, 85, 57, 0.12)",
                    }}
                    itemStyle={{ color: CHART_THEME.tooltipBorder, fontWeight: "600", fontSize: "14px" }}
                    labelStyle={{ color: CHART_THEME.tooltipText, fontWeight: "600" }}
                  />
                  <Bar dataKey="count" fill="url(#colorApp)" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    <LabelList dataKey="count" position="top" fill="#7f5539" fontWeight="600" />
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
                  <defs>
                    <linearGradient id="colorRole" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7f5539" stopOpacity={0.95}/>
                      <stop offset="95%" stopColor="#e8e0d5" stopOpacity={0.9}/>
                    </linearGradient>
                  </defs>
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
                    contentStyle={{
                      backgroundColor: CHART_THEME.tooltipBg,
                      border: `1px solid ${CHART_THEME.tooltipBorder}`,
                      borderRadius: "8px",
                      padding: "12px",
                      boxShadow: "0 4px 12px rgba(127, 85, 57, 0.12)",
                    }}
                    itemStyle={{ color: CHART_THEME.tooltipBorder, fontWeight: "600", fontSize: "14px" }}
                    labelStyle={{ color: CHART_THEME.tooltipText, fontWeight: "600" }}
                  />
                  <Bar dataKey="count" fill="url(#colorRole)" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    <LabelList dataKey="count" position="top" fill="#7f5539" fontWeight="600" />
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
