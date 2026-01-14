import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// No need for product mapping - Product Management uses its own tables

// PATCH - Toggle account status (only for products)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, userId } = body;

    if (!status || !["active", "inactive"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'active' or 'inactive'" },
        { status: 400 }
      );
    }

    // Get account from product_accounts
    const { data: account } = await supabase
      .from("product_accounts")
      .select("id, username, status")
      .eq("id", id)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // Get old status
    const oldStatus = account.status;

    const { data, error } = await supabase
      .from("product_accounts")
      .update({
        status: status,
        updated_at: new Date().toISOString(),
        updated_by: userId || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log ENABLE or DISABLE activity
    await logActivity({
      userId,
      action: status === "active" ? "ENABLE" : "DISABLE",
      tableName: "product_accounts",
      recordId: id,
      oldValue: { username: account.username, status: oldStatus },
      newValue: { username: account.username, status: status },
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

