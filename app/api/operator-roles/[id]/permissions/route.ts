import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET: Fetch permissions for an operator role
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // Await params in Next.js 15
    
    const { data, error } = await supabase
      .from("operator_role_permissions")
      .select("*")
      .eq("role_id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update permissions for an operator role
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // Await params in Next.js 15
    const body = await request.json();
    const { permissions } = body;

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Permissions array is required" },
        { status: 400 }
      );
    }

    // Delete existing permissions
    await supabase.from("operator_role_permissions").delete().eq("role_id", id);

    // Insert new permissions (save all, even if can_view is false)
    const permissionsToInsert = permissions
      .map((perm: any) => {
        // For Dashboard: auto-set can_view if view_all_data OR view_segment_data is true
        let canView = perm.can_view;
        if (perm.menu_name === 'dashboard' && (perm.view_all_data || perm.view_segment_data)) {
          canView = true;
        }
        
        // For Audit Logs: auto-set can_view if can_filter OR can_view_details is true
        if (perm.menu_name === 'audit-logs' && (perm.can_filter || perm.can_view_details)) {
          canView = true;
        }
        
        return {
          role_id: id,
          menu_name: perm.menu_name,
          can_view: canView,
          can_create: perm.can_create,
          can_edit: perm.can_edit,
          can_delete: perm.can_delete,
          can_enable_disable: perm.can_enable_disable,
          can_import: perm.can_import,
          can_export: perm.can_export,
          visible_columns: perm.visible_columns || [],
          // Dashboard specific
          view_all_data: perm.view_all_data || false,
          view_segment_data: perm.view_segment_data || false,
          // Audit Logs specific
          can_filter: perm.can_filter || false,
          can_view_details: perm.can_view_details || false,
          // Data filters
          allowed_applications: perm.allowed_applications || [],
          allowed_lines: perm.allowed_lines || [],
          allowed_departments: perm.allowed_departments || [],
        };
      });

    if (permissionsToInsert.length > 0) {
      const { error } = await supabase
        .from("operator_role_permissions")
        .insert(permissionsToInsert);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: "Permissions updated successfully",
      count: permissionsToInsert.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

