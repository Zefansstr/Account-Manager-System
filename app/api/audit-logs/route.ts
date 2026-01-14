import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Fetch audit logs with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");
    const table = searchParams.get("table");
    const days = searchParams.get("days");
    
    // Pagination params
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("activity_logs")
      .select(`
        *,
        operators (
          full_name,
          username
        )
      `, { count: 'exact' })
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

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format data with operator name
    const formattedData = (data || []).map((log: any) => ({
      ...log,
      operator_name: log.operators?.full_name || log.operators?.username || null,
      operators: undefined, // Remove nested object
    }));

    return NextResponse.json({ 
      data: formattedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

