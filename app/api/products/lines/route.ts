import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

export async function GET() {
  try {
    // Use single query with aggregation to avoid N+1 problem
    const { data, error } = await supabase
      .from("product_lines")
      .select("*, product_accounts(count)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    // Transform data - Supabase returns count as array with single object
    const transformed = (data || []).map((line: any) => {
      // Handle different Supabase response formats
      let accountCount = 0;
      if (Array.isArray(line.product_accounts)) {
        if (line.product_accounts.length > 0 && typeof line.product_accounts[0] === 'object') {
          accountCount = line.product_accounts[0].count || 0;
        }
      } else if (typeof line.product_accounts === 'number') {
        accountCount = line.product_accounts;
      }
      
      return {
        id: line.id,
        code: line.line_code,
        name: line.line_name,
        description: line.description,
        accountCount,
        status: line.status,
      };
    });

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
      .from("product_lines")
      .insert([{ line_code: code, line_name: name, description: description || null }])
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      action: "CREATE",
      tableName: "product_lines",
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
