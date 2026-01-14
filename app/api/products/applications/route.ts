import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// GET all product applications
export async function GET() {
  try {
    // Use single query with aggregation to avoid N+1 problem
    const { data, error } = await supabase
      .from("product_applications")
      .select("*, product_accounts(count)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    // Transform data - Supabase returns count as array with single object
    const transformed = (data || []).map((app: any) => {
      // Handle different Supabase response formats
      let accountCount = 0;
      if (Array.isArray(app.product_accounts)) {
        if (app.product_accounts.length > 0 && typeof app.product_accounts[0] === 'object') {
          accountCount = app.product_accounts[0].count || 0;
        }
      } else if (typeof app.product_accounts === 'number') {
        accountCount = app.product_accounts;
      }
      
      return {
        id: app.id,
        code: app.app_code,
        name: app.app_name,
        description: app.description,
        accountCount,
        status: app.status,
        created_at: app.created_at,
      };
    });

    return NextResponse.json({ data: transformed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST new product application
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, description, userId } = body;

    const { data, error } = await supabase
      .from("product_applications")
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
      tableName: "product_applications",
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
