import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// GET all device types
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("asset_types")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    // Get device counts separately
    const transformed = await Promise.all(
      (data || []).map(async (type: any) => {
        const { count } = await supabase
          .from("asset_accounts")
          .select("*", { count: "exact", head: true })
          .eq("type_id", type.id);
        
        return {
          id: type.id,
          code: type.type_code,
          name: type.type_name,
          description: type.description,
          accountCount: count || 0,
          status: type.status,
        };
      })
    );

    return NextResponse.json({ data: transformed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST new device type
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, description, userId } = body;

    const { data, error } = await supabase
      .from("asset_types")
      .insert([
        {
          type_code: code,
          type_name: name,
          description: description || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      action: "CREATE",
      tableName: "asset_types",
      recordId: data.id,
      newValue: { type_code: code, type_name: name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
