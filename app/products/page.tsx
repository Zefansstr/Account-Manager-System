"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, UserCheck, AppWindow, Layers, Building2, Shield, TrendingUp, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, PieChart, Pie, Cell, Legend } from "recharts";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { useProductsDashboard } from "@/hooks/use-products-dashboard";
import { DashboardSkeleton } from "@/components/ui/skeleton";

const STATUS_COLORS = {
  Active: "#46C46E",
  Inactive: "#94A3B8"
};

const CHART_COLORS = [
  "#46C46E", // Green primary
  "#6EE7B7", // Light green
  "#34D399", // Medium green
  "#10B981", // Darker green
  "#059669", // Dark green
  "#047857", // Very dark green
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, count }: any) => {
  const radius = outerRadius + 25;
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
        fill="hsl(var(--primary))"
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

export default function ProductsDashboardPage() {
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
  const { data: rawData, isLoading: loading, error } = useProductsDashboard(operatorId);

  // Transform data with memoization for performance
  const data = useMemo(() => {
    if (!rawData) {
      return {
        kpis: {
          totalAccounts: 0,
          activeAccounts: 0,
          totalApplications: 0,
          totalLines: 0,
          totalDepartments: 0,
          totalRoles: 0,
        },
        charts: {
          accountsStatus: [] as Array<{ name: string; count: number }>,
          accountsByDepartment: [] as Array<{ name: string; count: number }>,
          accountsByApplication: [] as Array<{ name: string; count: number }>,
          accountsByRole: [] as Array<{ name: string; count: number }>,
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
    trend: { value: number } | null;
  }>>(() => [
    {
      title: "Total Accounts",
      value: data.kpis.totalAccounts,
      icon: Users,
      trend: null,
    },
    {
      title: "Active Accounts",
      value: data.kpis.activeAccounts,
      icon: UserCheck,
      trend: null,
    },
    {
      title: "Total Applications",
      value: data.kpis.totalApplications,
      icon: AppWindow,
      trend: null,
    },
    {
      title: "Total Lines",
      value: data.kpis.totalLines,
      icon: Layers,
      trend: null,
    },
    {
      title: "Total Departments",
      value: data.kpis.totalDepartments,
      icon: Building2,
      trend: null,
    },
    {
      title: "Total Roles",
      value: data.kpis.totalRoles,
      icon: Shield,
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
                    <div className="bg-primary/10 dark:bg-primary/20 p-2.5 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-5 w-5 text-primary" />
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
          {/* Active vs Inactive Accounts - Donut Chart */}
          <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden">
            <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-card px-6 py-4">
              <CardTitle className="text-foreground flex items-center gap-2 text-lg font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                Active vs Inactive Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              {data.charts.accountsStatus.length > 0 ? (
                <div className="space-y-2">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={data.charts.accountsStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={{ stroke: 'hsl(var(--foreground))', strokeWidth: 2 }}
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
                            stroke="hsl(var(--card))"
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
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/5 dark:bg-primary/10 flex items-center justify-center">
                      <UserCheck className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>No data available</p>
                    <p className="text-xs text-muted-foreground mt-1">Data will appear here once available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Accounts by Department - Bar Chart */}
          <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden">
            <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-card px-6 py-4">
              <CardTitle className="text-foreground flex items-center gap-2 text-lg font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                Total Accounts by Departments
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              {data.charts.accountsByDepartment.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.charts.accountsByDepartment}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                      stroke="hsl(var(--border))"
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
                        fontFamily: 'Inter, sans-serif',
                        color: 'hsl(var(--foreground))'
                      }}
                      cursor={{ fill: 'hsl(var(--primary) / 0.1)' }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]}>
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
          {/* Accounts by Application - Bar Chart */}
          <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden">
            <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-card px-6 py-4">
              <CardTitle className="text-foreground flex items-center gap-2 text-lg font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                  <AppWindow className="h-5 w-5 text-primary" />
                </div>
                Total Accounts by Applications
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              {data.charts.accountsByApplication.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.charts.accountsByApplication}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                      stroke="hsl(var(--border))"
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
                        fontFamily: 'Inter, sans-serif',
                        color: 'hsl(var(--foreground))'
                      }}
                      cursor={{ fill: 'hsl(var(--primary) / 0.1)' }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]}>
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
                      <AppWindow className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>No data available</p>
                    <p className="text-xs text-muted-foreground mt-1">Data will appear here once available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Accounts by Role - Bar Chart */}
          <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden">
            <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-card px-6 py-4">
              <CardTitle className="text-foreground flex items-center gap-2 text-lg font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                Total Accounts by Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              {data.charts.accountsByRole.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.charts.accountsByRole}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                      stroke="hsl(var(--border))"
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
                        fontFamily: 'Inter, sans-serif',
                        color: 'hsl(var(--foreground))'
                      }}
                      cursor={{ fill: 'hsl(var(--primary) / 0.1)' }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]}>
                      <LabelList 
                        dataKey="count" 
                        position="top" 
                        style={{ fill: 'hsl(var(--foreground))', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: '600' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[320px] text-[#94A3B8]">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#F0FDF4] flex items-center justify-center">
                      <Shield className="h-8 w-8 text-[#94A3B8]" />
                    </div>
                    <p className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>No data available</p>
                    <p className="text-xs text-[#94A3B8] mt-1">Data will appear here once available</p>
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
