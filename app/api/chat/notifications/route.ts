import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET - Fetch recent chat notifications for operator
export async function GET(request: NextRequest) {
  try {
    const operatorId = request.headers.get("X-Operator-Id");

    if (!operatorId) {
      return NextResponse.json({ error: "Operator ID required" }, { status: 401 });
    }

    // Get recent unread messages from all rooms where operator is involved
    // This will serve as notifications
    const { data: recentMessages, error } = await supabase
      .from("chat_messages")
      .select(`
        id,
        message,
        created_at,
        sender_id,
        room_id,
        is_read,
        chat_rooms!inner(
          id,
          room_type,
          subject,
          group_name,
          is_deleted
        )
      `)
      .neq("sender_id", operatorId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }

    // Filter messages from rooms where operator is participant or involved
    const { data: participantRooms } = await supabase
      .from("chat_participants")
      .select("room_id")
      .eq("operator_id", operatorId)
      .is("left_at", null);

    const participantRoomIds = participantRooms?.map((p) => p.room_id) || [];

    // Also get rooms created by operator (for support chats)
    const { data: createdRooms } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("created_by", operatorId)
      .eq("is_deleted", false);

    const createdRoomIds = createdRooms?.map((r) => r.id) || [];

    // Combine both room IDs
    const relevantRoomIds = [...new Set([...participantRoomIds, ...createdRoomIds])];

    // Filter messages to only relevant rooms
    const notifications = (recentMessages || [])
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
          room_name: room.room_type === "group" 
            ? room.group_name 
            : room.subject,
        };
      });

    // Get sender info for each notification
    const senderIds = [...new Set(notifications.map((n: any) => n.sender_id))];
    const { data: senders } = await supabase
      .from("operators")
      .select("id, username")
      .in("id", senderIds);

    const senderMap = new Map(senders?.map((s) => [s.id, s.username]) || []);

    // Add sender username to notifications
    const enrichedNotifications = notifications.map((n: any) => ({
      ...n,
      sender_username: senderMap.get(n.sender_id) || "Unknown",
    }));

    return NextResponse.json({ 
      data: enrichedNotifications,
      count: enrichedNotifications.length 
    });
  } catch (error: any) {
    console.error("GET /api/chat/notifications error:", error);
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }
}

// POST - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message_ids, operator_id } = body;

    if (!message_ids || !Array.isArray(message_ids) || !operator_id) {
      return NextResponse.json(
        { error: "message_ids (array) and operator_id are required" },
        { status: 400 }
      );
    }

    // Mark messages as read
    const { error } = await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .in("id", message_ids)
      .neq("sender_id", operator_id);

    if (error) {
      console.error("Error marking notifications as read:", error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/chat/notifications error:", error);
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }
}

// DELETE - Delete notifications (mark as read)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { message_ids, operator_id } = body;

    if (!message_ids || !Array.isArray(message_ids) || !operator_id) {
      return NextResponse.json(
        { error: "message_ids (array) and operator_id are required" },
        { status: 400 }
      );
    }

    // Mark messages as read (this removes them from notifications)
    const { error } = await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .in("id", message_ids)
      .neq("sender_id", operator_id);

    if (error) {
      console.error("Error deleting notifications:", error);
      throw error;
    }

    // Update last_read_at for chat participants
    // Get room IDs from messages
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("room_id")
      .in("id", message_ids);

    if (messages && messages.length > 0) {
      const roomIds = [...new Set(messages.map((m) => m.room_id))];
      
      await supabase
        .from("chat_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("operator_id", operator_id)
        .in("room_id", roomIds);
    }

    return NextResponse.json({ success: true, deleted: message_ids.length });
  } catch (error: any) {
    console.error("DELETE /api/chat/notifications error:", error);
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }
}

