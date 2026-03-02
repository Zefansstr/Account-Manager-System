import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// PUT update asset account
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, typeId, brand, item, userUse, note, departmentTeam, storageLocation, purchaseAmount, currency, status, userId } = body;

    if (!code || !item) {
      return NextResponse.json(
        { error: "Code and Item are required" },
        { status: 400 }
      );
    }

    // Get old value before update
    const { data: oldData } = await supabase
      .from("asset_accounts")
      .select("*")
      .eq("id", id)
      .single();

    const updateData: any = {
      code,
      type_id: typeId || null,
      brand: brand || null,
      item,
      user_use: userUse !== undefined ? userUse : null,
      note: note || null,
      department_team: departmentTeam !== undefined ? departmentTeam : null,
      storage_location: storageLocation || null,
      purchase_amount: purchaseAmount || null,
      currency: currency || null,
      updated_at: new Date().toISOString(),
      updated_by: userId || null,
    };

    // Update status if provided
    if (status) {
      updateData.status = status;
    }

    const { data, error } = await supabase
      .from("asset_accounts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Log activity
    await logActivity({
      userId,
      action: "UPDATE",
      tableName: "asset_accounts",
      recordId: id,
      oldValue: { code: oldData?.code, item: oldData?.item },
      newValue: { code, item, type: typeId, brand },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE asset account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || undefined;

    // Get old value before delete
    const { data: oldData } = await supabase
      .from("asset_accounts")
      .select("*")
      .eq("id", id)
      .single();

    if (!oldData) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Delete asset_details first (if exists) to avoid foreign key constraint
    const { error: detailsError } = await supabase
      .from("asset_details")
      .delete()
      .eq("asset_id", id);

    if (detailsError) {
      console.error("Error deleting asset_details:", detailsError);
      // Continue with asset_accounts delete even if details delete fails
    }

    // Delete asset account
    const { error } = await supabase
      .from("asset_accounts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting asset_accounts:", error);
      // Check for foreign key constraint error
      if (error.code === "23503" || error.message?.includes("foreign key")) {
        return NextResponse.json(
          { error: "Cannot delete asset: It is referenced by other records. Please remove all references first." },
          { status: 400 }
        );
      }
      throw error;
    }

    // Log activity
    try {
      await logActivity({
        userId,
        action: "DELETE",
        tableName: "asset_accounts",
        recordId: id,
        oldValue: { code: oldData?.code, item: oldData?.item },
        ipAddress: getIpAddress(request),
        userAgent: getUserAgent(request),
      });
    } catch (logError) {
      console.error("Error logging activity:", logError);
      // Don't fail the delete if logging fails
    }

    return NextResponse.json({ message: "Asset deleted successfully" });
  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete asset. Please try again." },
      { status: 500 }
    );
  }
}
