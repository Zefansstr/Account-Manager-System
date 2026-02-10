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
    const { code, typeId, brand, item, userUse, note, departmentTeam, storageLocation, purchaseAmount, currency, userId } = body;

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

    const { data, error } = await supabase
      .from("asset_accounts")
      .update({
        code,
        type_id: typeId || null,
        brand: brand || null,
        item,
        user_use: userUse || null,
        note: note || null,
        department_team: departmentTeam || null,
        storage_location: storageLocation || null,
        purchase_amount: purchaseAmount || null,
        currency: currency || null,
        updated_at: new Date().toISOString(),
        updated_by: userId || null,
      })
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

    const { error } = await supabase
      .from("asset_accounts")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      action: "DELETE",
      tableName: "asset_accounts",
      recordId: id,
      oldValue: { code: oldData?.code, item: oldData?.item },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ message: "Asset deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
