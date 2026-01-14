import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, name, description, userId } = body;

    // Get old value before update
    const { data: oldData } = await supabase
      .from("product_roles")
      .select("*")
      .eq("id", id)
      .single();

    const { data, error } = await supabase
      .from("product_roles")
      .update({
        role_code: code,
        role_name: name,
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
      tableName: "product_roles",
      recordId: id,
      oldValue: { role_code: oldData?.role_code, role_name: oldData?.role_name },
      newValue: { role_code: code, role_name: name },
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
    const userId = searchParams.get("userId") || null;

    // Get old value before delete
    const { data: oldData } = await supabase
      .from("product_roles")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("product_roles")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      action: "DELETE",
      tableName: "product_roles",
      recordId: id,
      oldValue: { role_code: oldData?.role_code, role_name: oldData?.role_name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ message: "Role deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
