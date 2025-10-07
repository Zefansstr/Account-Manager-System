import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Fetch audit logs with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");
    const table = searchParams.get("table");
    const days = searchParams.get("days");

    let query = supabase
      .from("activity_logs")
      .select(`
        *,
        operators (
          full_name,
          username
        )
      `)
      .order("created_at", { ascending: false });

    // Apply filters
    if (action && action !== "all") {
      query = query.eq("action", action);
    }

    if (table && table !== "all") {
      query = query.eq("table_name", table);
    }

    if (days && days !== "all") {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      query = query.gte("created_at", daysAgo.toISOString());
    }

    // Limit to last 500 records
    query = query.limit(500);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format data with operator name
    const formattedData = (data || []).map((log: any) => ({
      ...log,
      operator_name: log.operators?.full_name || log.operators?.username || null,
      operators: undefined, // Remove nested object
    }));

    return NextResponse.json({ data: formattedData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

