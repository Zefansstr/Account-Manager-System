import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET: Fetch permissions for an operator
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("permissions")
      .select("*")
      .eq("operator_id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update permissions for an operator
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { permissions } = body;

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Permissions array is required" },
        { status: 400 }
      );
    }

    // Delete existing permissions
    await supabase.from("permissions").delete().eq("operator_id", id);

    // Insert new permissions (only those with can_view = true)
    const permissionsToInsert = permissions
      .filter((perm: any) => perm.can_view) // Only insert if menu is viewable
      .map((perm: any) => ({
        operator_id: id,
        menu_name: perm.menu_name,
        can_view: perm.can_view,
        can_create: perm.can_create,
        can_edit: perm.can_edit,
        can_delete: perm.can_delete,
        can_enable_disable: perm.can_enable_disable,
        can_import: perm.can_import,
        can_export: perm.can_export,
        visible_columns: perm.visible_columns || [],
      }));

    if (permissionsToInsert.length > 0) {
      const { error } = await supabase
        .from("permissions")
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

