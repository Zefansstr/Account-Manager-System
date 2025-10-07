import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// PATCH - Toggle account status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, userId } = body;

    if (!status || !["active", "inactive"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'active' or 'inactive'" },
        { status: 400 }
      );
    }

    // Get old status
    const { data: oldData } = await supabase
      .from("accounts")
      .select("username, status")
      .eq("id", params.id)
      .single();

    const { data, error } = await supabase
      .from("accounts")
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    // Log ENABLE or DISABLE activity
    await logActivity({
      userId,
      action: status === "active" ? "ENABLE" : "DISABLE",
      tableName: "accounts",
      recordId: params.id,
      oldValue: { username: oldData?.username, status: oldData?.status },
      newValue: { username: oldData?.username, status: status },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({
      success: true,
      data,
      message: `Account ${status === "active" ? "enabled" : "disabled"} successfully`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

