import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET: Fetch single operator
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // Await params in Next.js 15
    
    const { data, error } = await supabase
      .from("operators")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update operator
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // Await params in Next.js 15
    const body = await request.json();
    const { password, full_name, operator_role_id, status, userId } = body;

    // Get old data for audit log
    const { data: oldData } = await supabase
      .from("operators")
      .select("*")
      .eq("id", id)
      .single();

    // Prepare update object
    const updateData: any = {
      full_name,
      operator_role_id,
      status,
      updated_at: new Date().toISOString(),
    };

    // Only update password if provided
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const { data, error } = await supabase
      .from("operators")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Determine action: if status changed, log ENABLE/DISABLE, otherwise UPDATE
    let action: "UPDATE" | "ENABLE" | "DISABLE" = "UPDATE";
    if (oldData?.status !== status) {
      action = status === "active" ? "ENABLE" : "DISABLE";
    }

    // Log activity
    await logActivity({
      userId,
      action,
      tableName: "operators",
      recordId: id,
      oldValue: { username: oldData?.username, full_name: oldData?.full_name, status: oldData?.status },
      newValue: { username: data.username, full_name, status },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete operator
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // Await params in Next.js 15
    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    // Get data before delete
    const { data: oldData } = await supabase
      .from("operators")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("operators")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await logActivity({
      userId,
      action: "DELETE",
      tableName: "operators",
      recordId: id,
      oldValue: { username: oldData?.username, full_name: oldData?.full_name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ message: "Operator deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

