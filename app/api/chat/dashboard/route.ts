import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Combined dashboard endpoint - Get all chat data in ONE request
 * This reduces round trips from 5+ API calls to just 1!
 * 
 * Returns:
 * - All rooms (personal + groups + support)
 * - Unread count
 * - Notifications
 * - Operators list (cached)
 */
export async function GET(request: NextRequest) {
  try {
    const operatorId = request.headers.get("X-Operator-Id");

    if (!operatorId) {
      return NextResponse.json({ error: "Operator ID required" }, { status: 401 });
    }

    // Execute all queries in parallel for maximum speed
    const [
      operatorResult,
      participantRoomsResult,
      unreadCountResult,
      notificationsResult,
      operatorsListResult
    ] = await Promise.all([
      // 1. Get operator info
      supabase
        .from("operators")
        .select("id, operator_roles!inner(role_name)")
        .eq("id", operatorId)
        .single(),

      // 2. Get participant rooms
      supabase
        .from("chat_participants")
        .select("room_id")
        .eq("operator_id", operatorId)
        .is("left_at", null),

      // 3. Get unread count using function
      supabase.rpc("get_unread_count", { op_id: operatorId }),

      // 4. Get recent notifications (limited to 10)
      supabase
        .from("chat_messages")
        .select(`
          id,
          message,
          created_at,
          sender_id,
          room_id,
          chat_rooms!inner(room_type, subject, group_name, is_deleted)
        `)
        .neq("sender_id", operatorId)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(10),

      // 5. Get operators list (for chat creation)
      supabase
        .from("operators")
        .select("id, username, email, operator_roles!inner(role_name)")
        .eq("status", "active")
        .order("username", { ascending: true })
    ]);

    const { data: operator, error: opError } = operatorResult;
    if (opError) throw opError;

    const operatorRole = (operator?.operator_roles as any)?.role_name;
    const isAdmin = operatorRole === "Super Admin" || operatorRole === "Admin";

    const participantRoomIds = participantRoomsResult.data?.map(p => p.room_id) || [];

    // Build rooms query
    let roomsQuery = supabase
      .from("chat_rooms")
      .select("*")
      .eq("is_deleted", false);

    if (isAdmin) {
      if (participantRoomIds.length > 0) {
        roomsQuery = roomsQuery.or(`room_type.eq.support,id.in.(${participantRoomIds.join(",")})`);
      } else {
        roomsQuery = roomsQuery.eq("room_type", "support");
      }
    } else {
      if (participantRoomIds.length > 0) {
        roomsQuery = roomsQuery.or(`and(room_type.eq.support,created_by.eq.${operatorId}),id.in.(${participantRoomIds.join(",")})`);
      } else {
        roomsQuery = roomsQuery.eq("room_type", "support").eq("created_by", operatorId);
      }
    }

    roomsQuery = roomsQuery.order("last_message_at", { ascending: false });

    const { data: rooms, error: roomsError } = await roomsQuery;
    if (roomsError) throw roomsError;

    // Get room details (last message, unread count) in parallel
    const roomsWithDetails = await Promise.all(
      (rooms || []).map(async (room: any) => {
        const [lastMessageResult, unreadCountResult] = await Promise.all([
          supabase
            .from("chat_messages")
            .select("message, created_at, sender_id")
            .eq("room_id", room.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from("chat_messages")
            .select("id", { count: "exact", head: true })
            .eq("room_id", room.id)
            .eq("is_read", false)
            .neq("sender_id", operatorId)
        ]);

        return {
          ...room,
          lastMessage: lastMessageResult.data || null,
          unreadCount: unreadCountResult.count || 0,
        };
      })
    );

    // Process notifications
    const notificationMessages = notificationsResult.data || [];
    const relevantRoomIds = [...new Set([...participantRoomIds, ...rooms.map(r => r.id)])];
    
    const filteredNotifications = notificationMessages
      .filter((msg: any) => {
        const room = msg.chat_rooms;
        return room && !room.is_deleted && relevantRoomIds.includes(msg.room_id);
      })
      .map((msg: any) => {
        const room = msg.chat_rooms;
        return {
          id: msg.id,
          message: msg.message,
          created_at: msg.created_at,
          sender_id: msg.sender_id,
          room_id: msg.room_id,
          room_type: room.room_type,
          room_name: room.room_type === "group" ? room.group_name : room.subject,
        };
      });

    // Get sender usernames for notifications
    if (filteredNotifications.length > 0) {
      const senderIds = [...new Set(filteredNotifications.map((n: any) => n.sender_id))];
      const { data: senders } = await supabase
        .from("operators")
        .select("id, username")
        .in("id", senderIds);

      const senderMap = new Map(senders?.map((s) => [s.id, s.username]) || []);

      filteredNotifications.forEach((n: any) => {
        n.sender_username = senderMap.get(n.sender_id) || "Unknown";
      });
    }

    // Format operators list
    const operatorsList = (operatorsListResult.data || [])
      .filter((op: any) => op.id !== operatorId)
      .map((op: any) => ({
        id: op.id,
        username: op.username,
        email: op.email,
        role: (op.operator_roles as any)?.role_name || "Unknown",
      }));

    // Filter operators based on role
    const filteredOperators = isAdmin
      ? operatorsList
      : operatorsList.filter((op: any) => op.role === "Super Admin");

    return NextResponse.json({
      success: true,
      data: {
        rooms: roomsWithDetails,
        unreadCount: unreadCountResult.data || 0,
        notifications: filteredNotifications,
        operators: filteredOperators,
        operatorInfo: {
          id: operator.id,
          role: operatorRole,
          isAdmin,
          isSuperAdmin: operatorRole === "Super Admin",
        },
      },
    });
  } catch (error: any) {
    console.error("GET /api/chat/dashboard error:", error);
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }
}

