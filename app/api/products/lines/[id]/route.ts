import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// GET single product line
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("product_lines")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update product line
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
      .from("product_lines")
      .select("*")
      .eq("id", id)
      .single();

    const { data, error } = await supabase
      .from("product_lines")
      .update({
        line_code: code,
        line_name: name,
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
      tableName: "product_lines",
      recordId: id,
      oldValue: { line_code: oldData?.line_code, line_name: oldData?.line_name },
      newValue: { line_code: code, line_name: name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE product line
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
      .from("product_lines")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("product_lines")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      action: "DELETE",
      tableName: "product_lines",
      recordId: id,
      oldValue: { line_code: oldData?.line_code, line_name: oldData?.line_name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ message: "Line deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
