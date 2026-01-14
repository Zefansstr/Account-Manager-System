import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, name, description, userId } = body;

    // Get old value
    const { data: oldData } = await supabase.from("device_brands").select("*").eq("id", id).single();

    const { data, error } = await supabase
      .from("device_brands")
      .update({ brand_code: code, brand_name: name, description: description || null, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      action: "UPDATE",
      tableName: "device_brands",
      recordId: id,
      oldValue: { brand_code: oldData?.brand_code, brand_name: oldData?.brand_name },
      newValue: { brand_code: code, brand_name: name },
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
    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    // Get data before delete
    const { data: oldData } = await supabase.from("device_brands").select("*").eq("id", id).single();

    const { error } = await supabase.from("device_brands").delete().eq("id", id);
    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      action: "DELETE",
      tableName: "device_brands",
      recordId: id,
      oldValue: { brand_code: oldData?.brand_code, brand_name: oldData?.brand_name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ message: "Brand deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
