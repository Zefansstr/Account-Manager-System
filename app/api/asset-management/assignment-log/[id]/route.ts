import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// PUT update assignment log
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { date, assetId, assignedTo, department, reason, handledBy, remark, userId } = body;

    if (!date || !assignedTo) {
      return NextResponse.json(
        { error: "Date and Assigned To are required" },
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
        console.log("Asset ID is already a UUID:", resolvedAssetId);
      } else {
        // assetId is a code, lookup the actual UUID
        console.log("Looking up asset by code:", assetId.trim());
        const { data: assetData, error: assetError } = await supabase
          .from("asset_accounts")
          .select("id, code")
          .eq("code", assetId.trim())
          .single();
        
        if (assetError) {
          console.error("Error looking up asset by code:", assetError);
        } else if (assetData) {
          resolvedAssetId = assetData.id;
          console.log("Found asset:", { code: assetData.code, id: resolvedAssetId });
        } else {
          console.warn("Asset not found with code:", assetId.trim());
        }
      }
    } else {
      console.warn("No assetId provided, skipping asset update");
    }

    const { data, error } = await supabase
      .from("assignment_log")
      .update({
        date,
        asset_id: resolvedAssetId,
        assigned_to: assignedTo,
        department: department || null,
        reason: reason || null,
        handled_by: handledBy || null,
        remark: remark || null,
        updated_at: new Date().toISOString(),
        updated_by: userId || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: "Assignment log not found" }, { status: 404 });
    }

    // Update user_use and status in asset_accounts if asset_id exists
    if (resolvedAssetId) {
      const { data: updatedAsset, error: updateError } = await supabase
        .from("asset_accounts")
        .update({
          user_use: assignedTo,
          status: "active", // Set status to active when assigned
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        })
        .eq("id", resolvedAssetId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating asset_accounts user_use:", updateError);
        // Return error to user so they know the update failed
        return NextResponse.json(
          { 
            error: "Assignment log updated but failed to update asset user", 
            details: updateError.message 
          },
          { status: 500 }
        );
      }
      
      console.log("Successfully updated asset_accounts:", {
        assetId: resolvedAssetId,
        user_use: assignedTo,
        status: "active",
        updated_at: updatedAsset?.updated_at
      });
    } else {
      console.warn("No asset_id resolved, skipping asset_accounts update");
    }

    // Log activity
    await logActivity({
      userId,
      action: "UPDATE",
      tableName: "assignment_log",
      recordId: id,
      newValue: { date, assignedTo, assetId },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE assignment log
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || undefined;

    // Get the assignment log data before deleting (to get asset_id)
    const { data: logData } = await supabase
      .from("assignment_log")
      .select("asset_id, assigned_to")
      .eq("id", id)
      .single();

    const { data, error } = await supabase
      .from("assignment_log")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: "Assignment log not found" }, { status: 404 });
    }

    // Update user_use in asset_accounts based on the latest assignment log for this asset
    if (logData?.asset_id) {
      // Get the latest assignment log for this asset (by date, then by created_at)
      // Note: We query after delete, so the deleted log won't be included
      const { data: latestLogData, error: latestLogError } = await supabase
        .from("assignment_log")
        .select("assigned_to")
        .eq("asset_id", logData.asset_id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle no results

      // Update asset_accounts with the latest assigned_to, or null if no more logs
      const { data: updatedAsset, error: updateError } = await supabase
        .from("asset_accounts")
        .update({
          user_use: latestLogData?.assigned_to || null,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        })
        .eq("id", logData.asset_id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating asset_accounts user_use:", updateError);
        // Don't throw error, just log it - assignment log is already deleted
      } else {
        console.log("Successfully updated asset_accounts after delete:", {
          assetId: logData.asset_id,
          user_use: latestLogData?.assigned_to || null,
          updated_at: updatedAsset?.updated_at
        });
      }
    }

    // Log activity
    await logActivity({
      userId,
      action: "DELETE",
      tableName: "assignment_log",
      recordId: id,
      oldValue: { date: data.date, assignedTo: data.assigned_to },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ message: "Assignment log deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
