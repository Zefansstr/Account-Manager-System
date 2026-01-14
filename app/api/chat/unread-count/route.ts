import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET unread messages count for current operator
export async function GET(request: NextRequest) {
  try {
    const operatorId = request.headers.get("X-Operator-Id");
    
    if (!operatorId) {
      return NextResponse.json({ error: "Operator ID required" }, { status: 401 });
    }

    // Check if operator is Super Admin or Admin
    const { data: operator } = await supabase
      .from("operators")
      .select("operator_role_id, operator_roles!inner(role_name)")
      .eq("id", operatorId)
      .single();

    const operatorRoles = operator?.operator_roles as any;
    const roleName = operatorRoles?.role_name?.toLowerCase();
    const isAdmin = roleName === "super admin" || roleName === "admin";

    // Get rooms for this operator
    let roomQuery = supabase
      .from("chat_rooms")
      .select("id");

    if (!isAdmin) {
      roomQuery = roomQuery.eq("created_by", operatorId);
    }

    const { data: rooms } = await roomQuery;

    if (!rooms || rooms.length === 0) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const roomIds = rooms.map(r => r.id);

    // Count unread messages in these rooms (not sent by current operator)
    const { count, error } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .in("room_id", roomIds)
      .neq("sender_id", operatorId)
      .eq("is_read", false);

    if (error) throw error;

    return NextResponse.json({ unreadCount: count || 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

