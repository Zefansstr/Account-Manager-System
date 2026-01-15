import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Combined lookup endpoint to reduce API calls
// Returns all lookup data in a single request
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const module = searchParams.get("module") || "account-management"; // account-management, product-management, asset-management

    // Determine which tables to query based on module
    let applicationsTable = "applications";
    let linesTable = "lines";
    let departmentsTable = "departments";
    let rolesTable = "roles";

    if (module === "product-management") {
      applicationsTable = "product_applications";
      linesTable = "product_lines";
      departmentsTable = "product_departments";
      rolesTable = "product_roles";
    } else if (module === "asset-management") {
      applicationsTable = "asset_types";
      linesTable = "asset_brands";
      // Asset management doesn't have departments/roles
    }

    // Fetch all lookups in parallel
    const [applicationsRes, linesRes, departmentsRes, rolesRes] = await Promise.all([
      module === "asset-management"
        ? supabase
            .from(applicationsTable)
            .select("id, type_code, type_name")
            .order("created_at", { ascending: false })
            .limit(500)
        : supabase
            .from(applicationsTable)
            .select("id, app_code, app_name")
            .order("created_at", { ascending: false })
            .limit(500),
      module === "asset-management"
        ? supabase
            .from(linesTable)
            .select("id, brand_code, brand_name")
            .order("created_at", { ascending: false })
            .limit(500)
        : supabase
            .from(linesTable)
            .select("id, line_code, line_name")
            .order("created_at", { ascending: false })
            .limit(500),
      module !== "asset-management" 
        ? supabase
            .from(departmentsTable)
            .select("id, department_code, department_name")
            .order("created_at", { ascending: false })
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
      module !== "asset-management"
        ? supabase
            .from(rolesTable)
            .select("id, role_code, role_name")
            .order("created_at", { ascending: false })
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
    ]);

    // Transform data to consistent format
    const transformApplication = (app: any) => ({
      id: app.id,
      code: app.app_code || app.type_code,
      name: app.app_name || app.type_name,
    });

    const transformLine = (line: any) => ({
      id: line.id,
      code: line.line_code || line.brand_code,
      name: line.line_name || line.brand_name,
    });

    const transformDepartment = (dept: any) => ({
      id: dept.id,
      code: dept.department_code,
      name: dept.department_name,
    });

    const transformRole = (role: any) => ({
      id: role.id,
      code: role.role_code,
      name: role.role_name,
    });

    return NextResponse.json({
      data: {
        applications: (applicationsRes.data || []).map(transformApplication),
        lines: (linesRes.data || []).map(transformLine),
        departments: (departmentsRes.data || []).map(transformDepartment),
        roles: (rolesRes.data || []).map(transformRole),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
