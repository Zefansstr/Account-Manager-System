import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { code, name, description } = body;

    const { data, error } = await supabase
      .from("roles")
      .update({ role_code: code, role_name: name, description: description || null, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase.from("roles").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ message: "Role deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

