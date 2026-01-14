import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET - List all active operators (for chat selection)
export async function GET(request: NextRequest) {
  try {
    const operatorId = request.headers.get("X-Operator-Id");

    if (!operatorId) {
      return NextResponse.json({ error: "Operator ID required" }, { status: 401 });
    }

    // Get all active operators with their roles
    const { data: operators, error } = await supabase
      .from("operators")
      .select(`
        id,
        username,
        email,
        status,
        operator_roles!inner(id, role_name)
      `)
      .eq("status", "active")
      .order("username", { ascending: true });

    if (error) {
      console.error("Error fetching operators:", error);
      throw error;
    }

    // Format the data
    const formattedOperators = (operators || []).map((op: any) => ({
      id: op.id,
      username: op.username,
      email: op.email,
      status: op.status,
      role: op.operator_roles?.role_name || "Unknown",
      roleId: op.operator_roles?.id,
    }));

    return NextResponse.json({ data: formattedOperators });
  } catch (error: any) {
    console.error("GET /api/operators/list error:", error);
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }
}

