import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// GET: Fetch all operators (with pagination)
export async function GET(request: NextRequest) {
  try {
    // Get pagination and search params
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    // Build query with count
    let query = supabase
      .from("operators")
      .select(`
        *,
        operator_roles (
          role_name
        )
      `, { count: 'exact' });

    // Apply search filter if provided
    if (search) {
      query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Execute with pagination
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Flatten the role_name from nested object
    const formattedData = (data || []).map((op: any) => ({
      ...op,
      role_name: op.operator_roles?.role_name || "No Role",
      operator_roles: undefined,
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

// POST: Create new operator
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, full_name, operator_role_id, status, userId } = body;

    // Validate required fields
    if (!username || !password || !operator_role_id) {
      return NextResponse.json(
        { error: "Username, password, and role are required" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("operators")
      .insert([
        {
          username,
          password: hashedPassword,
          full_name,
          operator_role_id,
          status: status || "active",
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await logActivity({
      userId,
      action: "CREATE",
      tableName: "operators",
      recordId: data.id,
      newValue: { username, full_name, status: data.status },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

