import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required", success: false },
        { status: 400 }
      );
    }

    // Fetch operator
    const { data: operator, error: operatorError } = await supabase
      .from("operators")
      .select("*")
      .eq("username", username)
      .single();

    if (operatorError || !operator) {
      return NextResponse.json(
        { error: "Invalid credentials", success: false },
        { status: 401 }
      );
    }

    // Check if operator is active
    if (operator.status !== "active") {
      return NextResponse.json(
        { error: "Account is inactive. Please contact administrator.", success: false },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, operator.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials", success: false },
        { status: 401 }
      );
    }

    // Fetch permissions from role
    let permissions: any[] = [];
    
    if (operator.operator_role_id) {
      const { data: rolePermissions, error: permError } = await supabase
        .from("operator_role_permissions")
        .select("*")
        .eq("role_id", operator.operator_role_id);

      if (permError) {
        console.error("Error fetching role permissions:", permError);
      } else {
        permissions = rolePermissions || [];
      }

      // Check for operator-specific overrides
      const { data: overrides } = await supabase
        .from("permissions")
        .select("*")
        .eq("operator_id", operator.id);

      if (overrides && overrides.length > 0) {
        // Merge overrides with role permissions
        const overrideMap = new Map(overrides.map((o: any) => [o.menu_name, o]));
        permissions = permissions.map((perm: any) => {
          const override = overrideMap.get(perm.menu_name);
          return override || perm;
        });
      }
    }

    // Update last login
    await supabase
      .from("operators")
      .update({ last_login: new Date().toISOString() })
      .eq("id", operator.id);

    // Fetch role name for display
    const { data: roleData } = await supabase
      .from("operator_roles")
      .select("role_name")
      .eq("id", operator.operator_role_id)
      .single();

    // Log login activity
    await logActivity({
      userId: operator.id,
      action: "LOGIN",
      tableName: "operators",
      recordId: operator.id,
      newValue: { username: operator.username },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    // Remove password from response
    const { password: _, ...operatorData } = operator;

    return NextResponse.json({
      success: true,
      operator: {
        ...operatorData,
        role_name: roleData?.role_name || "No Role",
      },
      permissions: permissions || [],
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login", success: false },
      { status: 500 }
    );
  }
}

