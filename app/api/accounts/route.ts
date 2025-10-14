import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

export async function GET(request: NextRequest) {
  try {
    // Get operator ID from headers (sent from frontend)
    const operatorId = request.headers.get("X-Operator-Id");
    
    // Get pagination and search params
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const filterApplicationId = searchParams.get("application_id") || "";
    const filterLineId = searchParams.get("line_id") || "";
    const filterStatus = searchParams.get("status") || "";
    const offset = (page - 1) * limit;
    
    // Build base query
    let query = supabase
      .from("accounts")
      .select(`
        *,
        applications:application_id(id, app_code, app_name),
        lines:line_id(id, line_code, line_name),
        departments:department_id(id, department_code, department_name),
        roles:role_id(id, role_code, role_name)
      `, { count: 'exact' });
    
    // Apply data-level filters if operator is not Super Admin
    if (operatorId) {
      // Get operator's role
      const { data: operator } = await supabase
        .from("operators")
        .select("operator_role_id, operator_roles!inner(role_name)")
        .eq("id", operatorId)
        .single();
      
      const operatorRoles = operator?.operator_roles as any;
      const isSuperAdmin = operatorRoles?.role_name?.toLowerCase() === "super admin";
      
      if (!isSuperAdmin && operator?.operator_role_id) {
        // Get permissions for "Accounts" menu
        const { data: permissions } = await supabase
          .from("operator_role_permissions")
          .select("allowed_applications, allowed_lines, allowed_departments")
          .eq("role_id", operator.operator_role_id)
          .eq("menu_name", "accounts")
          .single();
        
        if (permissions) {
          // Check if any data filter exists (not null and not undefined)
          const hasApplicationFilter = permissions.allowed_applications !== null && permissions.allowed_applications !== undefined;
          const hasLineFilter = permissions.allowed_lines !== null && permissions.allowed_lines !== undefined;
          const hasDepartmentFilter = permissions.allowed_departments !== null && permissions.allowed_departments !== undefined;
          
          // If filter exists but empty = show NO data
          // If filter exists and has values = show filtered data
          // If filter doesn't exist (null/undefined) = show ALL data
          
          if (hasApplicationFilter) {
            if (permissions.allowed_applications.length === 0) {
              // Empty array = no data should be shown
              query = query.in("application_id", ["00000000-0000-0000-0000-000000000000"]); // Non-existent ID
            } else {
              query = query.in("application_id", permissions.allowed_applications);
            }
          }
          
          if (hasLineFilter) {
            if (permissions.allowed_lines.length === 0) {
              query = query.in("line_id", ["00000000-0000-0000-0000-000000000000"]);
            } else {
              query = query.in("line_id", permissions.allowed_lines);
            }
          }
          
          if (hasDepartmentFilter) {
            if (permissions.allowed_departments.length === 0) {
              query = query.in("department_id", ["00000000-0000-0000-0000-000000000000"]);
            } else {
              query = query.in("department_id", permissions.allowed_departments);
            }
          }
        }
      }
    }
    
    // Apply search filter if provided
    if (search) {
      query = query.or(`username.ilike.%${search}%,remark.ilike.%${search}%,roles.role_name.ilike.%${search}%`);
    }
    
    // Apply dropdown filters if provided
    if (filterApplicationId) {
      query = query.eq("application_id", filterApplicationId);
    }
    
    if (filterLineId) {
      query = query.eq("line_id", filterLineId);
    }
    
    if (filterStatus) {
      query = query.eq("status", filterStatus);
    }
    
    // Execute query with ordering, pagination, and count
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const transformed = data?.map((acc: any) => ({
      id: acc.id,
      application: acc.applications?.app_name || "-",
      applicationId: acc.application_id,
      line: acc.lines?.line_code || "-",
      lineId: acc.line_id,
      username: acc.username,
      password: acc.password,
      department: acc.departments?.department_name || "-",
      departmentId: acc.department_id,
      role: acc.roles?.role_name || "-",
      roleId: acc.role_id,
      remark: acc.remark,
      status: acc.status,
    }));

    return NextResponse.json({ 
      data: transformed,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { applicationId, lineId, username, password, departmentId, roleId, remark, userId } = body;

    const { data, error } = await supabase
      .from("accounts")
      .insert([{
        application_id: applicationId || null,
        line_id: lineId || null,
        username,
        password,
        department_id: departmentId || null,
        role_id: roleId || null,
        remark: remark || null,
      }])
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      action: "CREATE",
      tableName: "accounts",
      recordId: data.id,
      newValue: { username, department: departmentId, role: roleId },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

