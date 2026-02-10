import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, name, description, userId } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: "Code and Name are required" },
        { status: 400 }
      );
    }

    // Get old value before update
    const { data: oldData } = await supabase
      .from("asset_devices")
      .select("*")
      .eq("id", id)
      .single();

    const { data, error } = await supabase
      .from("asset_devices")
      .update({
        device_code: code,
        device_name: name,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        return NextResponse.json(
          { error: "Table 'asset_devices' does not exist. Please run the database migration script first." },
          { status: 500 }
        );
      }
      throw error;
    }

    // Log activity
    await logActivity({
      userId,
      action: "UPDATE",
      tableName: "asset_devices",
      recordId: id,
      oldValue: { device_code: oldData?.device_code, device_name: oldData?.device_name },
      newValue: { device_code: code, device_name: name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get("userId") || undefined;

    // Get old value before delete
    const { data: oldData } = await supabase
      .from("asset_devices")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("asset_devices")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        return NextResponse.json(
          { error: "Table 'asset_devices' does not exist. Please run the database migration script first." },
          { status: 500 }
        );
      }
      throw error;
    }

    // Log activity
    await logActivity({
      userId,
      action: "DELETE",
      tableName: "asset_devices",
      recordId: id,
      oldValue: { device_code: oldData?.device_code, device_name: oldData?.device_name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ message: "Device deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
