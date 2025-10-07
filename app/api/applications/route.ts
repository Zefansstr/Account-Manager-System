import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// GET all applications
export async function GET() {
  try {
    const { data, error, count } = await supabase
      .from("applications")
      .select("*, accounts(count)", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    // Transform data to include account count
    const transformed = data?.map((app: any) => ({
      id: app.id,
      code: app.app_code,
      name: app.app_name,
      description: app.description,
      accountCount: app.accounts?.[0]?.count || 0,
      status: app.status,
      created_at: app.created_at,
    }));

    return NextResponse.json({ data: transformed, count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST new application
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, description, userId } = body;

    const { data, error } = await supabase
      .from("applications")
      .insert([
        {
          app_code: code,
          app_name: name,
          description: description || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      action: "CREATE",
      tableName: "applications",
      recordId: data.id,
      newValue: { app_code: code, app_name: name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

