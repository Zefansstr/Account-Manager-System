"use client";

import { useEffect, useState, useMemo } from "react";
import { Smartphone, CheckCircle, Package, Tag, TrendingUp, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, PieChart, Pie, Cell } from "recharts";
import { PermissionGuard } from "@/components/auth/permission-guard";

const STATUS_COLORS = {
  Active: "hsl(var(--primary))",
  Inactive: "hsl(var(--muted-foreground))"
};

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.8)",
  "hsl(var(--primary) / 0.6)",
  "hsl(var(--primary) / 0.4)",
  "hsl(var(--primary) / 0.2)",
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = outerRadius + 25;
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

export default function DeviceManagementDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    kpis: {
      totalDevices: 0,
      activeDevices: 0,
      totalTypes: 0,
      totalBrands: 0,
    },
    charts: {
      devicesStatus: [] as Array<{ name: string; count: number }>,
      devicesByType: [] as Array<{ name: string; count: number }>,
      devicesByBrand: [] as Array<{ name: string; count: number }>,
      devicesByUserUse: [] as Array<{ name: string; count: number }>,
    },
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/device-management/dashboard/stats");
        const json = await res.json();

        if (res.ok) {
          setData(json);
        } else {
          console.error("Failed to fetch stats:", json.error);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const kpiCards: Array<{
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    trend: { value: number } | null;
  }> = [
    {
      title: "Total Devices",
      value: data.kpis.totalDevices,
      icon: Smartphone,
      color: "text-primary",
      bgColor: "bg-primary/5",
      trend: null,
    },
    {
      title: "Active Devices",
      value: data.kpis.activeDevices,
      icon: CheckCircle,
      color: "text-primary",
      bgColor: "bg-primary/5",
      trend: null,
    },
    {
      title: "Total Types",
      value: data.kpis.totalTypes,
      icon: Package,
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
  ];

  return (
    <PermissionGuard menuName="dashboard">
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
          {/* Active vs Inactive Devices - Donut Chart */}
          <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden">
            <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-card px-6 py-4">
              <CardTitle className="text-foreground flex items-center gap-2 text-lg font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <div className="p-2 bg-primary/5 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                Active vs Inactive Devices
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              {data.charts.devicesStatus.length > 0 ? (
                <div className="space-y-2">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={data.charts.devicesStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={{ stroke: 'white', strokeWidth: 2 }}
                        label={renderCustomizedLabel}
                        outerRadius={95}
                        innerRadius={60}
                        fill="hsl(var(--primary))"
                        dataKey="count"
                        paddingAngle={2}
                      >
                        {data.charts.devicesStatus.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]}
                            strokeWidth={3}
                            stroke="hsl(var(--card))"
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontFamily: 'Inter, sans-serif'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 mt-4">
                    {data.charts.devicesStatus.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] }}
                        />
                        <span className="text-sm text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {entry.name}: {entry.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
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

          {/* Devices by Type - Bar Chart */}
          <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden">
            <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-card px-6 py-4">
              <CardTitle className="text-foreground flex items-center gap-2 text-lg font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <div className="p-2 bg-primary/5 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                Total Devices by Type
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              {data.charts.devicesByType.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.charts.devicesByType}>
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
                        fontFamily: 'Inter, sans-serif'
                      }}
                      cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
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
                      <Package className="h-8 w-8 text-muted-foreground" />
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
          {/* Devices by Brand - Bar Chart */}
          <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden">
            <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-card px-6 py-4">
              <CardTitle className="text-foreground flex items-center gap-2 text-lg font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <div className="p-2 bg-primary/5 rounded-lg">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
                Total Devices by Brand
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              {data.charts.devicesByBrand.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.charts.devicesByBrand}>
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
                        fontFamily: 'Inter, sans-serif'
                      }}
                      cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
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
                      <Tag className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>No data available</p>
                    <p className="text-xs text-muted-foreground mt-1">Data will appear here once available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Devices by User Use - Bar Chart */}
          <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden">
            <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-card px-6 py-4">
              <CardTitle className="text-foreground flex items-center gap-2 text-lg font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <div className="p-2 bg-primary/5 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                Total Devices by User Use
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              {data.charts.devicesByUserUse.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.charts.devicesByUserUse}>
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
                        fontFamily: 'Inter, sans-serif'
                      }}
                      cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
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
                      <TrendingUp className="h-8 w-8 text-muted-foreground" />
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
