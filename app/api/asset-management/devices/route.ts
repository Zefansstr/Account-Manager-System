import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("asset_devices")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Supabase error:", error);
      // Check if table doesn't exist
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        return NextResponse.json(
          { error: "Table 'asset_devices' does not exist. Please run the database migration script first.", data: [] },
          { status: 500 }
        );
      }
      throw error;
    }

    // Get account counts separately (matching by item)
    const transformed = await Promise.all(
      (data || []).map(async (device: any) => {
        const { count } = await supabase
          .from("asset_accounts")
          .select("*", { count: "exact", head: true })
          .eq("item", device.device_name);
        
        return {
          id: device.id,
          code: device.device_code,
          name: device.device_name,
          description: device.description,
          accountCount: count || 0,
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

    if (!code || !name) {
      return NextResponse.json(
        { error: "Code and Name are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("asset_devices")
      .insert([{ device_code: code, device_name: name, description: description || null }])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      // Check if table doesn't exist
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        return NextResponse.json(
          { error: "Table 'asset_devices' does not exist. Please run the database migration script first." },
          { status: 500 }
        );
      }
      throw error;
    }

    // Log activity
    try {
      await logActivity({
        userId,
        action: "CREATE",
        tableName: "asset_devices",
        recordId: data.id,
        newValue: { device_code: code, device_name: name },
        ipAddress: getIpAddress(request),
        userAgent: getUserAgent(request),
      });
    } catch (logError) {
      console.error("Error logging activity:", logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/asset-management/devices:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create device. Please check if the table exists." },
      { status: 500 }
    );
  }
}
