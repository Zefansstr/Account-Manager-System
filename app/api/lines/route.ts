import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("lines")
      .select("*, accounts(count)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    const transformed = data?.map((line: any) => ({
      id: line.id,
      code: line.line_code,
      name: line.line_name,
      description: line.description,
      accountCount: line.accounts?.[0]?.count || 0,
      status: line.status,
    }));

    return NextResponse.json({ data: transformed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, description, userId } = body;

    const { data, error } = await supabase
      .from("lines")
      .insert([{ line_code: code, line_name: name, description: description || null }])
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      action: "CREATE",
      tableName: "lines",
      recordId: data.id,
      newValue: { line_code: code, line_name: name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

