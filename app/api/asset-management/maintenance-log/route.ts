import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// GET all maintenance logs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const assetId = searchParams.get("assetId") || "";
    const status = searchParams.get("status") || "";

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("maintenance_log")
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
      query = query.or(`issue_description.ilike.%${search}%,maintenance_result.ilike.%${search}%,operator.ilike.%${search}%,maintenance_unit.ilike.%${search}%`);
    }
    if (assetId) {
      query = query.eq("asset_id", assetId);
    }
    if (status) {
      query = query.eq("current_status", status);
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
      issueDescription: log.issue_description,
      currentStatus: log.current_status || "pending",
      maintenanceResult: log.maintenance_result || null,
      cost: log.cost || null,
      maintenanceUnit: log.maintenance_unit || null,
      operator: log.operator || null,
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

// POST new maintenance log
export async function POST(request: Request) {
  try {
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
      .insert([
        {
          date,
          asset_id: resolvedAssetId,
          issue_description: issueDescription,
          current_status: currentStatus || "pending",
          maintenance_result: maintenanceResult || null,
          cost: cost || null,
          maintenance_unit: maintenanceUnit || null,
          operator: operator || null,
          remark: remark || null,
          created_by: userId || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Update asset status to "maintenance" if asset_id exists
    if (resolvedAssetId) {
      const { error: updateError } = await supabase
        .from("asset_accounts")
        .update({
          status: "maintenance",
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        })
        .eq("id", resolvedAssetId);

      if (updateError) {
        console.error("Error updating asset_accounts status:", updateError);
        // Don't throw error, just log it - maintenance log is already created
      }
    }

    // Log activity
    await logActivity({
      userId,
      action: "CREATE",
      tableName: "maintenance_log",
      recordId: data.id,
      newValue: { date, issueDescription, assetId },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
