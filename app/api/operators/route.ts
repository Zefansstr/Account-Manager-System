import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// GET: Fetch all operators
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("operators")
      .select(`
        *,
        operator_roles (
          role_name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Flatten the role_name from nested object
    const formattedData = (data || []).map((op: any) => ({
      ...op,
      role_name: op.operator_roles?.role_name || "No Role",
      operator_roles: undefined,
    }));

    return NextResponse.json({ data: formattedData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create new operator
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, full_name, operator_role_id, status, userId } = body;

    // Validate required fields
    if (!username || !password || !operator_role_id) {
      return NextResponse.json(
        { error: "Username, password, and role are required" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("operators")
      .insert([
        {
          username,
          password: hashedPassword,
          full_name,
          operator_role_id,
          status: status || "active",
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await logActivity({
      userId,
      action: "CREATE",
      tableName: "operators",
      recordId: data.id,
      newValue: { username, full_name, status: data.status },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

