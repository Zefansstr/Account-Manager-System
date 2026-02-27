import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("asset_brands")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    // Get device counts separately
    const transformed = await Promise.all(
      (data || []).map(async (brand: any) => {
        const { count } = await supabase
          .from("asset_accounts")
          .select("*", { count: "exact", head: true })
          .eq("brand_id", brand.id);
        
        return {
          id: brand.id,
          code: brand.brand_code,
          name: brand.brand_name,
          description: brand.description,
          accountCount: count || 0,
          status: brand.status,
        };
      })
    );

    return NextResponse.json({ data: transformed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, description, userId } = body;

    const { data, error } = await supabase
      .from("asset_brands")
      .insert([{ brand_code: code, brand_name: name, description: description || null }])
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      action: "CREATE",
      tableName: "asset_brands",
      recordId: data.id,
      newValue: { brand_code: code, brand_name: name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
