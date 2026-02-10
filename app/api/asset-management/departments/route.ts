import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("asset_departments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    // Get account counts separately (matching by department_name)
    const transformed = await Promise.all(
      (data || []).map(async (dept: any) => {
        const { count } = await supabase
          .from("asset_accounts")
          .select("*", { count: "exact", head: true })
          .eq("department_team", dept.department_name);
        
        return {
          id: dept.id,
          code: dept.department_code,
          name: dept.department_name,
          description: dept.description,
          accountCount: count || 0,
        };
      })
    );

    return NextResponse.json({ data: transformed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, description, userId } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: "Code and Name are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("asset_departments")
      .insert([{ department_code: code, department_name: name, description: description || null }])
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      action: "CREATE",
      tableName: "asset_departments",
      recordId: data.id,
      newValue: { department_code: code, department_name: name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
