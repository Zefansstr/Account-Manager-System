import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// POST - Bulk update account status
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountIds, status, userId } = body;

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid accountIds. Must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!status || !["active", "inactive"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'active' or 'inactive'" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("accounts")
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .in("id", accountIds)
      .select();

    if (error) throw error;

    // Log bulk ENABLE or DISABLE activity for each account
    const action = status === "active" ? "ENABLE" : "DISABLE";
    for (const account of data) {
      await logActivity({
        userId,
        action,
        tableName: "accounts",
        recordId: account.id,
        newValue: { username: account.username, status: status, bulk: true },
        ipAddress: getIpAddress(request),
        userAgent: getUserAgent(request),
      });
    }

    return NextResponse.json({
      success: true,
      message: `${data.length} account(s) ${status === "active" ? "enabled" : "disabled"} successfully`,
      updated: data.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

