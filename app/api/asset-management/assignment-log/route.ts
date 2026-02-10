import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// GET all assignment logs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const assetId = searchParams.get("assetId") || "";

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("assignment_log")
      .select(`
        *,
        asset_accounts:asset_id (
          id,
          code,
          item
        )
      `, { count: "exact" })
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`assigned_to.ilike.%${search}%,department.ilike.%${search}%,handled_by.ilike.%${search}%`);
    }
    if (assetId) {
      query = query.eq("asset_id", assetId);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform data
    const transformed = (data || []).map((log: any) => ({
      id: log.id,
      date: log.date,
      assetId: log.asset_id,
      assetCode: log.asset_accounts?.code || null,
      assetItem: log.asset_accounts?.item || null,
      assignedTo: log.assigned_to,
      department: log.department || null,
      reason: log.reason || null,
      handledBy: log.handled_by || null,
      remark: log.remark || null,
      createdAt: log.created_at,
      updatedAt: log.updated_at,
    }));

    return NextResponse.json({
      data: transformed,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST new assignment log
export async function POST(request: Request) {
  try {
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
      .insert([
        {
          date,
          asset_id: resolvedAssetId,
          assigned_to: assignedTo,
          department: department || null,
          reason: reason || null,
          handled_by: handledBy || null,
          remark: remark || null,
          created_by: userId || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

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
            error: "Assignment log created but failed to update asset user", 
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
      action: "CREATE",
      tableName: "assignment_log",
      recordId: data.id,
      newValue: { date, assignedTo, assetId },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
