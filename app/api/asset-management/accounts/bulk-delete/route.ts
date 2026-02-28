import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// POST - Bulk delete asset accounts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assetIds, userId } = body;

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid assetIds. Must be a non-empty array" },
        { status: 400 }
      );
    }

    // Get old values before delete for audit log
    const { data: oldData } = await supabase
      .from("asset_accounts")
      .select("id, code, item")
      .in("id", assetIds);

    if (!oldData || oldData.length === 0) {
      return NextResponse.json(
        { error: "No assets found to delete" },
        { status: 404 }
      );
    }

    // Delete asset accounts
    const { error } = await supabase
      .from("asset_accounts")
      .delete()
      .in("id", assetIds);

    if (error) throw error;

    // Log activity for bulk delete
    if (userId && oldData.length > 0) {
      await logActivity({
        userId,
        action: "DELETE",
        tableName: "asset_accounts",
        recordId: oldData[0].id,
        oldValue: { 
          bulkDelete: true,
          deletedCount: oldData.length,
          codes: oldData.map(a => a.code)
        },
        ipAddress: getIpAddress(request),
        userAgent: getUserAgent(request),
      });
    }

    return NextResponse.json({
      success: true,
      message: `${oldData.length} asset(s) deleted successfully`,
      deleted: oldData.length,
    });
  } catch (error: any) {
    console.error("Bulk delete error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete assets" },
      { status: 500 }
    );
  }
}
