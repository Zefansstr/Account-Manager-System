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
      .from("asset_departments")
      .select("*")
      .eq("id", id)
      .single();

    const { data, error } = await supabase
      .from("asset_departments")
      .update({
        department_code: code,
        department_name: name,
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
      tableName: "asset_departments",
      recordId: id,
      oldValue: { department_code: oldData?.department_code, department_name: oldData?.department_name },
      newValue: { department_code: code, department_name: name },
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
      .from("asset_departments")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("asset_departments")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      action: "DELETE",
      tableName: "asset_departments",
      recordId: id,
      oldValue: { department_code: oldData?.department_code, department_name: oldData?.department_name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ message: "Department deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
