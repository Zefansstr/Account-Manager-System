import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Get operator ID from header or query
    const operatorId = request.headers.get("X-Operator-Id");

    if (!operatorId) {
      return NextResponse.json(
        { error: "Not authenticated", success: false },
        { status: 401 }
      );
    }

    // Fetch operator
    const { data: operator, error: operatorError } = await supabase
      .from("operators")
      .select("*")
      .eq("id", operatorId)
      .single();

    if (operatorError || !operator) {
      return NextResponse.json(
        { error: "Operator not found", success: false },
        { status: 404 }
      );
    }

    // Fetch permissions
    const { data: permissions, error: permError } = await supabase
      .from("permissions")
      .select("*")
      .eq("operator_id", operator.id);

    if (permError) {
      console.error("Error fetching permissions:", permError);
    }

    // Remove password from response
    const { password: _, ...operatorData } = operator;

    return NextResponse.json({
      success: true,
      operator: operatorData,
      permissions: permissions || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "An error occurred", success: false },
      { status: 500 }
    );
  }
}

