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
    
    // Build queries with optional data filtering
    let accountsQuery = supabase.from("accounts").select("id", { count: "exact", head: true });
    let activeAccountsQuery = supabase.from("accounts").select("id", { count: "exact", head: true }).eq("status", "active");
    let accountsByDeptQuery = supabase.from("accounts").select("department_id, departments(department_code, department_name)");
    let accountsByAppQuery = supabase.from("accounts").select("application_id, applications(app_code, app_name)");
    let accountsByRoleQuery = supabase.from("accounts").select("role_id, roles(role_code, role_name)");
    
    // Apply data filters if segment data is enabled
    if (hasSegmentData && allowedFilters) {
      // Apply filters: empty array means show NO data
      if (allowedFilters.applications.length === 0) {
        accountsQuery = accountsQuery.in("application_id", ["00000000-0000-0000-0000-000000000000"]);
        activeAccountsQuery = activeAccountsQuery.in("application_id", ["00000000-0000-0000-0000-000000000000"]);
        accountsByDeptQuery = accountsByDeptQuery.in("application_id", ["00000000-0000-0000-0000-000000000000"]);
        accountsByAppQuery = accountsByAppQuery.in("application_id", ["00000000-0000-0000-0000-000000000000"]);
        accountsByRoleQuery = accountsByRoleQuery.in("application_id", ["00000000-0000-0000-0000-000000000000"]);
      } else if (allowedFilters.applications.length > 0) {
        accountsQuery = accountsQuery.in("application_id", allowedFilters.applications);
        activeAccountsQuery = activeAccountsQuery.in("application_id", allowedFilters.applications);
        accountsByDeptQuery = accountsByDeptQuery.in("application_id", allowedFilters.applications);
        accountsByAppQuery = accountsByAppQuery.in("application_id", allowedFilters.applications);
        accountsByRoleQuery = accountsByRoleQuery.in("application_id", allowedFilters.applications);
      }
      
      if (allowedFilters.lines.length === 0) {
        accountsQuery = accountsQuery.in("line_id", ["00000000-0000-0000-0000-000000000000"]);
        activeAccountsQuery = activeAccountsQuery.in("line_id", ["00000000-0000-0000-0000-000000000000"]);
        accountsByDeptQuery = accountsByDeptQuery.in("line_id", ["00000000-0000-0000-0000-000000000000"]);
        accountsByAppQuery = accountsByAppQuery.in("line_id", ["00000000-0000-0000-0000-000000000000"]);
        accountsByRoleQuery = accountsByRoleQuery.in("line_id", ["00000000-0000-0000-0000-000000000000"]);
      } else if (allowedFilters.lines.length > 0) {
        accountsQuery = accountsQuery.in("line_id", allowedFilters.lines);
        activeAccountsQuery = activeAccountsQuery.in("line_id", allowedFilters.lines);
        accountsByDeptQuery = accountsByDeptQuery.in("line_id", allowedFilters.lines);
        accountsByAppQuery = accountsByAppQuery.in("line_id", allowedFilters.lines);
        accountsByRoleQuery = accountsByRoleQuery.in("line_id", allowedFilters.lines);
      }
      
      if (allowedFilters.departments.length === 0) {
        accountsQuery = accountsQuery.in("department_id", ["00000000-0000-0000-0000-000000000000"]);
        activeAccountsQuery = activeAccountsQuery.in("department_id", ["00000000-0000-0000-0000-000000000000"]);
        accountsByDeptQuery = accountsByDeptQuery.in("department_id", ["00000000-0000-0000-0000-000000000000"]);
        accountsByAppQuery = accountsByAppQuery.in("department_id", ["00000000-0000-0000-0000-000000000000"]);
        accountsByRoleQuery = accountsByRoleQuery.in("department_id", ["00000000-0000-0000-0000-000000000000"]);
      } else if (allowedFilters.departments.length > 0) {
        accountsQuery = accountsQuery.in("department_id", allowedFilters.departments);
        activeAccountsQuery = activeAccountsQuery.in("department_id", allowedFilters.departments);
        accountsByDeptQuery = accountsByDeptQuery.in("department_id", allowedFilters.departments);
        accountsByAppQuery = accountsByAppQuery.in("department_id", allowedFilters.departments);
        accountsByRoleQuery = accountsByRoleQuery.in("department_id", allowedFilters.departments);
      }
    }
    
    // Get all data with counts
    const [
      accountsRes,
      activeAccountsRes,
      applicationsRes,
      linesRes,
      departmentsRes,
      rolesRes,
      accountsByDeptRes,
      accountsByAppRes,
      accountsByRoleRes,
    ] = await Promise.all([
      // Total accounts (filtered)
      accountsQuery,
      // Active accounts (filtered)
      activeAccountsQuery,
      // Total applications
      supabase.from("applications").select("id", { count: "exact", head: true }),
      // Total lines
      supabase.from("lines").select("id", { count: "exact", head: true }),
      // Total departments
      supabase.from("departments").select("id", { count: "exact", head: true }),
      // Total roles
      supabase.from("roles").select("id", { count: "exact", head: true }),
      // Accounts by department (filtered)
      accountsByDeptQuery,
      // Accounts by application (filtered)
      accountsByAppQuery,
      // Accounts by role (filtered)
      accountsByRoleQuery,
    ]);

    // Calculate inactive accounts
    const inactiveAccounts = (accountsRes.count || 0) - (activeAccountsRes.count || 0);

    // Process accounts by department
    const deptGroups: any = {};
    accountsByDeptRes.data?.forEach((acc: any) => {
      if (acc.departments) {
        const key = acc.departments.department_code;
        deptGroups[key] = {
          name: acc.departments.department_name,
          count: (deptGroups[key]?.count || 0) + 1,
        };
      }
    });

    // Process accounts by application
    const appGroups: any = {};
    accountsByAppRes.data?.forEach((acc: any) => {
      if (acc.applications) {
        const key = acc.applications.app_code;
        appGroups[key] = {
          name: acc.applications.app_name,
          count: (appGroups[key]?.count || 0) + 1,
        };
      }
    });

    // Process accounts by role
    const roleGroups: any = {};
    accountsByRoleRes.data?.forEach((acc: any) => {
      if (acc.roles) {
        const key = acc.roles.role_code;
        roleGroups[key] = {
          name: acc.roles.role_name,
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

