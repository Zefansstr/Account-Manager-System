import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// GET single application
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update application
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
      .from("applications")
      .select("*")
      .eq("id", id)
      .single();

    const { data, error } = await supabase
      .from("applications")
      .update({
        app_code: code,
        app_name: name,
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
      tableName: "applications",
      recordId: id,
      oldValue: { app_code: oldData?.app_code, app_name: oldData?.app_name },
      newValue: { app_code: code, app_name: name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE application
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
      .from("applications")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      action: "DELETE",
      tableName: "applications",
      recordId: id,
      oldValue: { app_code: oldData?.app_code, app_name: oldData?.app_name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ message: "Application deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

