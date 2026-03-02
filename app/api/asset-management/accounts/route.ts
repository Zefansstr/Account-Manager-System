import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// GET all device accounts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const typeId = searchParams.get("typeId") || "";
    const brandId = searchParams.get("brandId") || "";
    const status = searchParams.get("status") || "";
    const deviceId = searchParams.get("deviceId") || "";
    const brand = searchParams.get("brand") || "";
    const storageLocation = searchParams.get("storageLocation") || "";
    const departmentTeam = searchParams.get("departmentTeam") || "";

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("asset_accounts")
      .select(`
        *,
        asset_types:type_id (
          id,
          type_code,
          type_name
        )
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply filters
    if (search) {
      // Search in all relevant fields
      query = query.or(
        `code.ilike.%${search}%,` +
        `item.ilike.%${search}%,` +
        `brand.ilike.%${search}%,` +
        `user_use.ilike.%${search}%,` +
        `department_team.ilike.%${search}%,` +
        `storage_location.ilike.%${search}%,` +
        `note.ilike.%${search}%`
      );
    }
    if (typeId) {
      query = query.eq("type_id", typeId);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (deviceId) {
      // Filter by device (item field matches device name)
      query = query.eq("item", deviceId);
    }
    if (brand) {
      query = query.eq("brand", brand);
    }
    if (storageLocation) {
      query = query.eq("storage_location", storageLocation);
    }
    if (departmentTeam) {
      query = query.eq("department_team", departmentTeam);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform data
    const transformed = (data || []).map((asset: any) => ({
      id: asset.id,
      code: asset.code,
      type: asset.asset_types?.type_name || null,
      typeId: asset.type_id,
      brand: asset.brand || null,
      item: asset.item,
      userUse: asset.user_use || null,
      note: asset.note || null,
      status: asset.status || "active",
      departmentTeam: asset.department_team || null,
      storageLocation: asset.storage_location || null,
      purchaseAmount: asset.purchase_amount || null,
      currency: asset.currency || null,
      createdAt: asset.created_at,
      updatedAt: asset.updated_at,
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

// POST new device account
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, typeId, brand, item, userUse, note, departmentTeam, storageLocation, purchaseAmount, currency, userId } = body;

    if (!code || !item) {
      return NextResponse.json(
        { error: "Code and Item are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("asset_accounts")
      .insert([
        {
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
          status: "not_used", // Default status for new assets
          created_by: userId || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      action: "CREATE",
      tableName: "asset_accounts",
      recordId: data.id,
      newValue: { code, item, type: typeId, brand },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
