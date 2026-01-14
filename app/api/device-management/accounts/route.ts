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

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("device_accounts")
      .select(`
        *,
        device_types:type_id (
          id,
          type_code,
          type_name
        ),
        device_brands:brand_id (
          id,
          brand_code,
          brand_name
        )
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply filters
    if (search) {
      // Search in code and user_use only
      query = query.or(`code.ilike.%${search}%,user_use.ilike.%${search}%`);
    }
    if (typeId) {
      query = query.eq("type_id", typeId);
    }
    if (brandId) {
      query = query.eq("brand_id", brandId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform data
    const transformed = (data || []).map((device: any) => ({
      id: device.id,
      code: device.code,
      type: device.device_types?.type_name || null,
      typeId: device.type_id,
      brand: device.device_brands?.brand_name || null,
      brandId: device.brand_id,
      item: device.item,
      specification: device.specification || null,
      userUse: device.user_use || null,
      note: device.note || null,
      status: device.status || "active",
      createdAt: device.created_at,
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
    const { code, typeId, brandId, item, specification, userUse, note, userId } = body;

    if (!code || !item) {
      return NextResponse.json(
        { error: "Code and Item are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("device_accounts")
      .insert([
        {
          code,
          type_id: typeId || null,
          brand_id: brandId || null,
          item,
          specification: specification || null,
          user_use: userUse || null,
          note: note || null,
          status: "active",
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
      tableName: "device_accounts",
      recordId: data.id,
      newValue: { code, item, type: typeId, brand: brandId },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
