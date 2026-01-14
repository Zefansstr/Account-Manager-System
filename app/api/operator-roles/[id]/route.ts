import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET: Fetch single operator role
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("operator_roles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch operator count
    const { count } = await supabase
      .from("operators")
      .select("*", { count: "exact", head: true })
      .eq("operator_role_id", id);

    return NextResponse.json({ 
      data: {
        ...data,
        operator_count: count || 0,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update operator role
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role_name, description, status } = body;

    // Check if it's a system role
    const { data: existingRole } = await supabase
      .from("operator_roles")
      .select("is_system_role")
      .eq("id", id)
      .single();

    if (existingRole?.is_system_role) {
      return NextResponse.json(
        { error: "System roles cannot be modified" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("operator_roles")
      .update({
        role_name,
        description,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete operator role
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    // Check if it's a system role
    const { data: existingRole } = await supabase
      .from("operator_roles")
      .select("is_system_role")
      .eq("id", id)
      .single();

    if (existingRole?.is_system_role) {
      return NextResponse.json(
        { error: "System roles cannot be deleted" },
        { status: 403 }
      );
    }

    // Check if role is assigned to any operators
    const { count } = await supabase
      .from("operators")
      .select("*", { count: "exact", head: true })
      .eq("operator_role_id", id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete role assigned to ${count} operator(s)` },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("operator_roles")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Role deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

