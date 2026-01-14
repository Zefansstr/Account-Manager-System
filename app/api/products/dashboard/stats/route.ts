import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Get operator ID from header for data filtering
    const operatorId = request.headers.get("X-Operator-Id");
    
    // Check if operator has segment data filtering enabled
    let allowedFilters: any = null;
    let hasSegmentData = false;
    
    if (operatorId) {
      const { data: operator } = await supabase
        .from("operators")
        .select("operator_role_id")
        .eq("id", operatorId)
        .single();
      
      if (operator?.operator_role_id) {
        const { data: permissions } = await supabase
          .from("operator_role_permissions")
          .select("*")
          .eq("role_id", operator.operator_role_id)
          .eq("menu_name", "dashboard")
          .eq("module", "product-management")
          .single();
        
        // Check if view_segment_data is enabled
        if (permissions?.view_segment_data) {
          hasSegmentData = true;
          
          // Get allowed filters from Accounts menu permissions
          const { data: accountsPerms } = await supabase
            .from("operator_role_permissions")
            .select("*")
            .eq("role_id", operator.operator_role_id)
            .eq("menu_name", "accounts")
            .eq("module", "product-management")
            .single();
          
          if (accountsPerms) {
            allowedFilters = {
              applications: accountsPerms.allowed_applications || [],
              lines: accountsPerms.allowed_lines || [],
              departments: accountsPerms.allowed_departments || [],
            };
          }
        }
      }
    }
    
    // Build queries - Use product_* tables
    // Optimized: Use count-only queries for KPIs
    let accountsQuery = supabase.from("product_accounts").select("id", { count: "exact", head: true });
    let activeAccountsQuery = supabase.from("product_accounts").select("id", { count: "exact", head: true }).eq("status", "active");
    
    // Apply data filters if segment data is enabled
    if (hasSegmentData && allowedFilters) {
      // Apply filters: empty array means show NO data
      if (allowedFilters.applications.length === 0) {
        accountsQuery = accountsQuery.in("application_id", ["00000000-0000-0000-0000-000000000000"]);
        activeAccountsQuery = activeAccountsQuery.in("application_id", ["00000000-0000-0000-0000-000000000000"]);
      } else if (allowedFilters.applications.length > 0) {
        accountsQuery = accountsQuery.in("application_id", allowedFilters.applications);
        activeAccountsQuery = activeAccountsQuery.in("application_id", allowedFilters.applications);
      }
      
      if (allowedFilters.lines.length === 0) {
        accountsQuery = accountsQuery.in("line_id", ["00000000-0000-0000-0000-000000000000"]);
        activeAccountsQuery = activeAccountsQuery.in("line_id", ["00000000-0000-0000-0000-000000000000"]);
      } else if (allowedFilters.lines.length > 0) {
        accountsQuery = accountsQuery.in("line_id", allowedFilters.lines);
        activeAccountsQuery = activeAccountsQuery.in("line_id", allowedFilters.lines);
      }
      
      if (allowedFilters.departments.length === 0) {
        accountsQuery = accountsQuery.in("department_id", ["00000000-0000-0000-0000-000000000000"]);
        activeAccountsQuery = activeAccountsQuery.in("department_id", ["00000000-0000-0000-0000-000000000000"]);
      } else if (allowedFilters.departments.length > 0) {
        accountsQuery = accountsQuery.in("department_id", allowedFilters.departments);
        activeAccountsQuery = activeAccountsQuery.in("department_id", allowedFilters.departments);
      }
    }
    
    // Optimize: Get all data with counts in parallel
    // Use single query for accounts with all relations to reduce round trips
    let accountsWithRelationsQuery = supabase
      .from("product_accounts")
      .select(`
        id,
        status,
        department_id,
        application_id,
        role_id,
        product_departments:department_id(department_code, department_name),
        product_applications:application_id(app_code, app_name),
        product_roles:role_id(role_code, role_name)
      `);
    
    // Apply same filters to accounts with relations query
    if (hasSegmentData && allowedFilters) {
      if (allowedFilters.applications.length === 0) {
        accountsWithRelationsQuery = accountsWithRelationsQuery.in("application_id", ["00000000-0000-0000-0000-000000000000"]);
      } else if (allowedFilters.applications.length > 0) {
        accountsWithRelationsQuery = accountsWithRelationsQuery.in("application_id", allowedFilters.applications);
      }
      
      if (allowedFilters.lines.length === 0) {
        accountsWithRelationsQuery = accountsWithRelationsQuery.in("line_id", ["00000000-0000-0000-0000-000000000000"]);
      } else if (allowedFilters.lines.length > 0) {
        accountsWithRelationsQuery = accountsWithRelationsQuery.in("line_id", allowedFilters.lines);
      }
      
      if (allowedFilters.departments.length === 0) {
        accountsWithRelationsQuery = accountsWithRelationsQuery.in("department_id", ["00000000-0000-0000-0000-000000000000"]);
      } else if (allowedFilters.departments.length > 0) {
        accountsWithRelationsQuery = accountsWithRelationsQuery.in("department_id", allowedFilters.departments);
      }
    }

    // Get all data in parallel - optimized queries
    const [
      accountsRes,
      activeAccountsRes,
      applicationsRes,
      linesRes,
      departmentsRes,
      rolesRes,
      accountsWithRelationsRes,
    ] = await Promise.all([
      // Total accounts (count only)
      accountsQuery,
      // Active accounts (count only)
      activeAccountsQuery,
      // Total applications (count only)
      supabase.from("product_applications").select("id", { count: "exact", head: true }),
      // Total lines (count only)
      supabase.from("product_lines").select("id", { count: "exact", head: true }),
      // Total departments (count only)
      supabase.from("product_departments").select("id", { count: "exact", head: true }),
      // Total roles (count only)
      supabase.from("product_roles").select("id", { count: "exact", head: true }),
      // Accounts with all relations (single query for charts)
      accountsWithRelationsQuery,
    ]);

    // Calculate inactive accounts
    const inactiveAccounts = (accountsRes.count || 0) - (activeAccountsRes.count || 0);

    // Process all chart data from single query result
    const deptGroups: any = {};
    const appGroups: any = {};
    const roleGroups: any = {};
    
    accountsWithRelationsRes.data?.forEach((acc: any) => {
      // Process by department
      if (acc.product_departments) {
        const key = acc.product_departments.department_code;
        deptGroups[key] = {
          name: acc.product_departments.department_name,
          count: (deptGroups[key]?.count || 0) + 1,
        };
      }
      
      // Process by application
      if (acc.product_applications) {
        const key = acc.product_applications.app_code;
        appGroups[key] = {
          name: acc.product_applications.app_name,
          count: (appGroups[key]?.count || 0) + 1,
        };
      }
      
      // Process by role
      if (acc.product_roles) {
        const key = acc.product_roles.role_code;
        roleGroups[key] = {
          name: acc.product_roles.role_name,
          count: (roleGroups[key]?.count || 0) + 1,
        };
      }
    });

    return NextResponse.json({
      kpis: {
        totalAccounts: accountsRes.count || 0,
        activeAccounts: activeAccountsRes.count || 0,
        totalApplications: applicationsRes.count || 0,
        totalLines: linesRes.count || 0,
        totalDepartments: departmentsRes.count || 0,
        totalRoles: rolesRes.count || 0,
      },
      charts: {
        accountsStatus: [
          { name: "Active", count: activeAccountsRes.count || 0 },
          { name: "Inactive", count: inactiveAccounts },
        ],
        accountsByDepartment: Object.entries(deptGroups).map(([code, data]: any) => ({
          name: data.name,
          count: data.count,
        })),
        accountsByApplication: Object.entries(appGroups).map(([code, data]: any) => ({
          name: data.name,
          count: data.count,
        })),
        accountsByRole: Object.entries(roleGroups).map(([code, data]: any) => ({
          name: data.name,
          count: data.count,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
