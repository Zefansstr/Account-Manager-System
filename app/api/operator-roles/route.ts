import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Fetch all operator roles
export async function GET() {
  try {
    // Fetch roles
    const { data: roles, error } = await supabase
      .from("operator_roles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch operator count for each role
    const rolesWithCount = await Promise.all(
      (roles || []).map(async (role) => {
        const { count } = await supabase
          .from("operators")
          .select("*", { count: "exact", head: true })
          .eq("operator_role_id", role.id);

        return {
          ...role,
          operator_count: count || 0,
        };
      })
    );

    return NextResponse.json({ data: rolesWithCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create new operator role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role_code, role_name, description, status } = body;

    // Validate required fields
    if (!role_code || !role_name) {
      return NextResponse.json(
        { error: "Role code and role name are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("operator_roles")
      .insert([
        {
          role_code: role_code.toUpperCase(),
          role_name,
          description,
          status: status || "active",
          is_system_role: false,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

