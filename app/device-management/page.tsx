"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, UserCheck, AppWindow, Layers, Building2, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, PieChart, Pie, Cell } from "recharts";
import { PermissionGuard } from "@/components/auth/permission-guard";

const STATUS_COLORS = {
  Active: "#22c55e",
  Inactive: "#6b7280"
};

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
  // Empty data - no API calls
  const loading = false;
  const data = useMemo(() => {
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
        accountsStatus: [],
        accountsByDepartment: [],
        accountsByApplication: [],
        accountsByRole: [],
      },
    };
  }, []);

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
            <div className="flex items-center justify-center h-[320px] text-muted-foreground">
              No data available
            </div>
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
            <div className="flex items-center justify-center h-[320px] text-muted-foreground">
              No data available
            </div>
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
            <div className="flex items-center justify-center h-[320px] text-muted-foreground">
              No data available
            </div>
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
            <div className="flex items-center justify-center h-[320px] text-muted-foreground">
              No data available
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </PermissionGuard>
  );
}
