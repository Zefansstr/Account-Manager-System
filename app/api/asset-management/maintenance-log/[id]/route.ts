import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// PUT update maintenance log
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { date, assetId, issueDescription, currentStatus, maintenanceResult, cost, maintenanceUnit, operator, remark, userId } = body;

    if (!date || !issueDescription) {
      return NextResponse.json(
        { error: "Date and Issue Description are required" },
        { status: 400 }
      );
    }

    // Lookup asset_id from asset code if assetId is provided as code (string)
    let resolvedAssetId: string | null = null;
    if (assetId && assetId.trim()) {
      // Check if assetId is already a UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(assetId)) {
        resolvedAssetId = assetId;
      } else {
        // assetId is a code, lookup the actual UUID
        const { data: assetData, error: assetError } = await supabase
          .from("asset_accounts")
          .select("id")
          .eq("code", assetId.trim())
          .single();
        
        if (!assetError && assetData) {
          resolvedAssetId = assetData.id;
        }
        // If not found, resolvedAssetId remains null (optional field)
      }
    }

    const { data, error } = await supabase
      .from("maintenance_log")
      .update({
        date,
        asset_id: resolvedAssetId,
        issue_description: issueDescription,
        current_status: currentStatus || "pending",
        maintenance_result: maintenanceResult || null,
        cost: cost || null,
        maintenance_unit: maintenanceUnit || null,
        operator: operator || null,
        remark: remark || null,
        updated_at: new Date().toISOString(),
        updated_by: userId || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: "Maintenance log not found" }, { status: 404 });
    }

    // Update asset status based on maintenance log status
    if (resolvedAssetId) {
      let newAssetStatus = "maintenance";
      
      // If maintenance status is "completed", set asset status to "active"
      if (currentStatus === "completed") {
        newAssetStatus = "active";
      }

      const { error: updateError } = await supabase
        .from("asset_accounts")
        .update({
          status: newAssetStatus,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        })
        .eq("id", resolvedAssetId);

      if (updateError) {
        console.error("Error updating asset_accounts status:", updateError);
        // Don't throw error, just log it - maintenance log is already updated
      }
    }

    // Log activity
    await logActivity({
      userId,
      action: "UPDATE",
      tableName: "maintenance_log",
      recordId: id,
      newValue: { date, issueDescription, assetId },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE maintenance log
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || undefined;

    const { data, error } = await supabase
      .from("maintenance_log")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: "Maintenance log not found" }, { status: 404 });
    }

    // Log activity
    await logActivity({
      userId,
      action: "DELETE",
      tableName: "maintenance_log",
      recordId: id,
      oldValue: { date: data.date, issueDescription: data.issue_description },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ message: "Maintenance log deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
