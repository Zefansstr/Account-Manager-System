import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET all chat rooms for current operator
export async function GET(request: NextRequest) {
  try {
    const operatorId = request.headers.get("X-Operator-Id");
    
    if (!operatorId) {
      return NextResponse.json({ error: "Operator ID required" }, { status: 401 });
    }

    // Check if operator is Super Admin or Admin
    const { data: operator, error: opError } = await supabase
      .from("operators")
      .select("operator_role_id, operator_roles!inner(role_name)")
      .eq("id", operatorId)
      .single();

    if (opError) {
      console.error("Operator fetch error:", opError);
      return NextResponse.json({ error: opError.message, details: opError }, { status: 500 });
    }

    const operatorRoles = operator?.operator_roles as any;
    const roleName = operatorRoles?.role_name?.toLowerCase();
    const isAdmin = roleName === "super admin" || roleName === "admin";

    // Get rooms where operator is participant
    const { data: participantRooms } = await supabase
      .from("chat_participants")
      .select("room_id")
      .eq("operator_id", operatorId)
      .is("left_at", null);

    const participantRoomIds = participantRooms?.map(p => p.room_id) || [];

    // Build query based on role
    let query = supabase
      .from("chat_rooms")
      .select("*")
      .eq("is_deleted", false);

    if (isAdmin) {
      // Admin sees all support chats + their personal/group chats
      if (participantRoomIds.length > 0) {
        query = query.or(`room_type.eq.support,id.in.(${participantRoomIds.join(",")})`);
      } else {
        query = query.eq("room_type", "support");
      }
    } else {
      // Regular operators see support chats they created + personal/group chats they're in
      if (participantRoomIds.length > 0) {
        query = query.or(`and(room_type.eq.support,created_by.eq.${operatorId}),id.in.(${participantRoomIds.join(",")})`);
      } else {
        query = query.eq("room_type", "support").eq("created_by", operatorId);
      }
    }

    query = query.order("last_message_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Chat rooms query error:", error);
      throw error;
    }

    // Get last message for each room
    const roomsWithLastMessage = await Promise.all(
      (data || []).map(async (room: any) => {
        const { data: lastMessage } = await supabase
          .from("chat_messages")
          .select("message, created_at, sender_id")
          .eq("room_id", room.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Get unread count for this operator
        const { count: unreadCount } = await supabase
          .from("chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("room_id", room.id)
          .eq("is_read", false)
          .neq("sender_id", operatorId);

        return {
          ...room,
          lastMessage: lastMessage || null,
          unreadCount: unreadCount || 0,
        };
      })
    );

    return NextResponse.json({ data: roomsWithLastMessage });
  } catch (error: any) {
    console.error("GET /api/chat/rooms error:", error);
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }
}

// POST create new chat room
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subject, description, priority, created_by } = body;

    console.log("POST /api/chat/rooms body:", body);

    if (!subject || !created_by) {
      return NextResponse.json(
        { error: "Subject and created_by are required" },
        { status: 400 }
      );
    }

    // Create chat room
    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .insert({
        subject,
        description,
        priority: priority || "normal",
        created_by,
        status: "open",
      })
      .select()
      .single();

    if (roomError) {
      console.error("Room creation error:", roomError);
      throw roomError;
    }

    // Add creator as participant
    await supabase
      .from("chat_participants")
      .insert({
        room_id: room.id,
        operator_id: created_by,
      });

    // Create system message
    await supabase
      .from("chat_messages")
      .insert({
        room_id: room.id,
        sender_id: created_by,
        message: `Support chat created: ${subject}`,
        message_type: "system",
        is_read: true,
      });

    return NextResponse.json({ data: room }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/chat/rooms error:", error);
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }
}

// DELETE - Soft delete chat room (Super Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("room_id");
    const operatorId = searchParams.get("operator_id");

    if (!roomId || !operatorId) {
      return NextResponse.json(
        { error: "room_id and operator_id are required" },
        { status: 400 }
      );
    }

    // Check if operator is Super Admin
    const { data: operator, error: opError } = await supabase
      .from("operators")
      .select("id, operator_roles!inner(role_name)")
      .eq("id", operatorId)
      .single();

    if (opError) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 });
    }

    const operatorRole = (operator?.operator_roles as any)?.role_name;
    const isSuperAdmin = operatorRole === "Super Admin";

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Only Super Admin can delete chat rooms" },
        { status: 403 }
      );
    }

    // Soft delete the room
    const { error: deleteError } = await supabase
      .from("chat_rooms")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: operatorId,
      })
      .eq("id", roomId);

    if (deleteError) {
      console.error("Error deleting chat room:", deleteError);
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/chat/rooms error:", error);
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }
}

