import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// GET single device type
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("device_types")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update device type
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, name, description, userId } = body;

    // Get old value before update
    const { data: oldData } = await supabase
      .from("device_types")
      .select("*")
      .eq("id", id)
      .single();

    const { data, error } = await supabase
      .from("device_types")
      .update({
        type_code: code,
        type_name: name,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      action: "UPDATE",
      tableName: "device_types",
      recordId: id,
      oldValue: { type_code: oldData?.type_code, type_name: oldData?.type_name },
      newValue: { type_code: code, type_name: name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE device type
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    // Get data before delete
    const { data: oldData } = await supabase
      .from("device_types")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("device_types")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      action: "DELETE",
      tableName: "device_types",
      recordId: id,
      oldValue: { type_code: oldData?.type_code, type_name: oldData?.type_name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ message: "Type deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
