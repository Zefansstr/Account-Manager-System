"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, UserCheck, AppWindow, Layers, Building2, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, PieChart, Pie, Cell } from "recharts";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { getDepartmentDisplayName, getRoleDisplayName } from "@/lib/display-names";
import { useDashboard } from "@/hooks/use-dashboard";
import { DashboardSkeleton } from "@/components/ui/skeleton";

const STATUS_COLORS = {
  Active: "#22c55e",
  Inactive: "#6b7280"
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = outerRadius + 25; // Position label outside the donut
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central" 
      fontSize="16" 
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export default function DashboardPage() {
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
      title: "Total Accounts",
      value: data.kpis.totalAccounts,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Active Accounts",
      value: data.kpis.activeAccounts,
      icon: UserCheck,
      color: "text-primary",
    },
    {
      title: "Total Applications",
      value: data.kpis.totalApplications,
      icon: AppWindow,
      color: "text-primary",
    },
    {
      title: "Total Lines",
      value: data.kpis.totalLines,
      icon: Layers,
      color: "text-primary",
    },
    {
      title: "Total Departments",
      value: data.kpis.totalDepartments,
      icon: Building2,
      color: "text-primary",
    },
    {
      title: "Total Roles",
      value: data.kpis.totalRoles,
      icon: Shield,
      color: "text-primary",
    },
  ];

  return (
    <PermissionGuard menuName="dashboard">
      <div className="space-y-4">
      {/* KPI Cards - Single Row */}
      <div className="grid grid-cols-6 gap-3">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-foreground">
                  {kpi.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Active vs Inactive Accounts - Donut Chart */}
        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-foreground flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
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
                      labelLine={false}
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
                          strokeWidth={2}
                          stroke="#1a1d23"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#2D333B",
                        border: "1px solid #22c55e",
                        borderRadius: "8px",
                        padding: "12px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                      }}
                      itemStyle={{ color: "#FFFFFF", fontWeight: "bold" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend - Raised Position */}
                <div className="grid grid-cols-2 gap-2 -mt-2">
                  {data.charts.accountsStatus.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 bg-secondary/50 rounded-md px-3 py-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] }}
                      />
                      <span className="text-sm text-foreground font-medium">{entry.name}</span>
                      <span className="ml-auto text-sm font-bold text-primary">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[320px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accounts by Department - Bar Chart */}
        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Total Accounts by Departments
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {data.charts.accountsByDepartment.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.charts.accountsByDepartment} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorDept" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444C56" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    stroke="#ADBAC7"
                    tick={{ fill: "#ADBAC7", fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#ADBAC7" 
                    tick={{ fill: "#ADBAC7", fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(34, 197, 94, 0.1)' }}
                    contentStyle={{
                      backgroundColor: "#2D333B",
                      border: "2px solid #22c55e",
                      borderRadius: "8px",
                      padding: "12px",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                    }}
                    itemStyle={{ color: "#22c55e", fontWeight: "bold", fontSize: "14px" }}
                    labelStyle={{ color: "#FFFFFF", fontWeight: "bold" }}
                  />
                  <Bar dataKey="count" fill="url(#colorDept)" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    <LabelList dataKey="count" position="top" fill="#22c55e" fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[320px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Accounts by Application - Bar Chart */}
        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-foreground flex items-center gap-2">
              <AppWindow className="h-5 w-5 text-primary" />
              Total Accounts by Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {data.charts.accountsByApplication.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.charts.accountsByApplication} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444C56" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    stroke="#ADBAC7"
                    tick={{ fill: "#ADBAC7", fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#ADBAC7" 
                    tick={{ fill: "#ADBAC7", fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(34, 197, 94, 0.1)' }}
                    contentStyle={{
                      backgroundColor: "#2D333B",
                      border: "2px solid #22c55e",
                      borderRadius: "8px",
                      padding: "12px",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                    }}
                    itemStyle={{ color: "#22c55e", fontWeight: "bold", fontSize: "14px" }}
                    labelStyle={{ color: "#FFFFFF", fontWeight: "bold" }}
                  />
                  <Bar dataKey="count" fill="url(#colorApp)" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    <LabelList dataKey="count" position="top" fill="#22c55e" fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[320px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accounts by Role - Bar Chart */}
        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Total Accounts by Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {data.charts.accountsByRole.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.charts.accountsByRole} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRole" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444C56" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    stroke="#ADBAC7"
                    tick={{ fill: "#ADBAC7", fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#ADBAC7" 
                    tick={{ fill: "#ADBAC7", fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(34, 197, 94, 0.1)' }}
                    contentStyle={{
                      backgroundColor: "#2D333B",
                      border: "2px solid #22c55e",
                      borderRadius: "8px",
                      padding: "12px",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                    }}
                    itemStyle={{ color: "#22c55e", fontWeight: "bold", fontSize: "14px" }}
                    labelStyle={{ color: "#FFFFFF", fontWeight: "bold" }}
                  />
                  <Bar dataKey="count" fill="url(#colorRole)" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    <LabelList dataKey="count" position="top" fill="#22c55e" fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[320px] text-muted-foreground">
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
