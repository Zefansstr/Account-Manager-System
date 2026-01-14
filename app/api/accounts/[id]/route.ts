import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { applicationId, lineId, username, password, departmentId, roleId, remark, userId } = body;

    // Get old value before update
    const { data: oldData } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", id)
      .single();

    const { data, error } = await supabase
      .from("accounts")
      .update({
        application_id: applicationId || null,
        line_id: lineId || null,
        username,
        password,
        department_id: departmentId || null,
        role_id: roleId || null,
        remark: remark || null,
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
      tableName: "accounts",
      recordId: id,
      oldValue: { username: oldData?.username, status: oldData?.status },
      newValue: { username, status: data.status },
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
    // Get data before delete
    const { data: oldData } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) throw error;

    // Get userId from request body if available
    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    // Log activity
    await logActivity({
      userId,
      action: "DELETE",
      tableName: "accounts",
      recordId: id,
      oldValue: { username: oldData?.username },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

