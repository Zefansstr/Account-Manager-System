import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST - Create or get personal chat between two operators
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initiator_id, target_operator_id } = body;

    if (!initiator_id || !target_operator_id) {
      return NextResponse.json(
        { error: "initiator_id and target_operator_id are required" },
        { status: 400 }
      );
    }

    // Cannot create personal chat with yourself
    if (initiator_id === target_operator_id) {
      return NextResponse.json(
        { error: "Cannot create personal chat with yourself" },
        { status: 400 }
      );
    }

    // Get initiator role
    const { data: initiator, error: initiatorError } = await supabase
      .from("operators")
      .select("id, operator_roles!inner(role_name)")
      .eq("id", initiator_id)
      .single();

    if (initiatorError) {
      return NextResponse.json(
        { error: "Initiator not found" },
        { status: 404 }
      );
    }

    const initiatorRole = (initiator?.operator_roles as any)?.role_name;
    const isInitiatorSuperAdmin = initiatorRole === "Super Admin";

    // Get target operator role
    const { data: targetOperator, error: targetError } = await supabase
      .from("operators")
      .select("id, username, operator_roles!inner(role_name)")
      .eq("id", target_operator_id)
      .single();

    if (targetError) {
      return NextResponse.json(
        { error: "Target operator not found" },
        { status: 404 }
      );
    }

    const targetRole = (targetOperator?.operator_roles as any)?.role_name;
    const isTargetSuperAdmin = targetRole === "Super Admin";

    // Permission check:
    // 1. Super Admin can initiate chat with anyone
    // 2. Regular operator can only initiate chat with Super Admin
    if (!isInitiatorSuperAdmin && !isTargetSuperAdmin) {
      return NextResponse.json(
        { error: "You can only create personal chats with Super Admin" },
        { status: 403 }
      );
    }

    // Check if personal chat already exists between these two operators
    const { data: existingRooms, error: checkError } = await supabase
      .from("chat_rooms")
      .select(`
        id,
        room_type,
        subject,
        created_at,
        is_deleted,
        chat_participants!inner(operator_id)
      `)
      .eq("room_type", "personal")
      .eq("is_deleted", false);

    if (checkError) {
      console.error("Error checking existing rooms:", checkError);
    }

    // Find room where both operators are participants
    let existingRoom = null;
    if (existingRooms) {
      for (const room of existingRooms) {
        const participants = (room.chat_participants as any[]).map(p => p.operator_id);
        if (
          participants.includes(initiator_id) &&
          participants.includes(target_operator_id) &&
          participants.length === 2
        ) {
          existingRoom = room;
          break;
        }
      }
    }

    if (existingRoom) {
      // Return existing room
      return NextResponse.json({ 
        data: { 
          id: existingRoom.id, 
          isNew: false,
          room: existingRoom
        } 
      });
    }

    // Create new personal chat room
    const { data: newRoom, error: roomError } = await supabase
      .from("chat_rooms")
      .insert({
        room_type: "personal",
        subject: `Personal Chat with ${targetOperator.username}`,
        created_by: initiator_id,
        status: "open",
      })
      .select()
      .single();

    if (roomError) {
      console.error("Error creating room:", roomError);
      throw roomError;
    }

    // Add both participants
    const { error: participantsError } = await supabase
      .from("chat_participants")
      .insert([
        {
          room_id: newRoom.id,
          operator_id: initiator_id,
          role: isInitiatorSuperAdmin ? "super_admin" : "member",
          added_by: initiator_id,
        },
        {
          room_id: newRoom.id,
          operator_id: target_operator_id,
          role: isTargetSuperAdmin ? "super_admin" : "member",
          added_by: initiator_id,
        },
      ]);

    if (participantsError) {
      console.error("Error adding participants:", participantsError);
      throw participantsError;
    }

    // Create system message
    await supabase
      .from("chat_messages")
      .insert({
        room_id: newRoom.id,
        sender_id: initiator_id,
        message: `Personal chat started`,
        message_type: "system",
        is_read: false,
      });

    return NextResponse.json({ 
      data: { 
        id: newRoom.id, 
        isNew: true,
        room: newRoom
      } 
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/chat/personal error:", error);
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }
}

// GET - List all personal chats for current operator
export async function GET(request: NextRequest) {
  try {
    const operatorId = request.headers.get("X-Operator-Id");

    if (!operatorId) {
      return NextResponse.json({ error: "Operator ID required" }, { status: 401 });
    }

    // Get all personal chat rooms where operator is participant
    const { data: rooms, error } = await supabase
      .from("chat_rooms")
      .select(`
        id,
        room_type,
        subject,
        status,
        created_by,
        created_at,
        last_message_at,
        chat_participants!inner(operator_id)
      `)
      .eq("room_type", "personal")
      .eq("is_deleted", false)
      .eq("chat_participants.operator_id", operatorId)
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("Error fetching personal chats:", error);
      throw error;
    }

    // Get additional info for each room
    const roomsWithDetails = await Promise.all(
      (rooms || []).map(async (room: any) => {
        // Get last message
        const { data: lastMessage } = await supabase
          .from("chat_messages")
          .select("message, created_at, sender_id")
          .eq("room_id", room.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count: unreadCount } = await supabase
          .from("chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("room_id", room.id)
          .eq("is_read", false)
          .neq("sender_id", operatorId);

        // Get other participant info
        const { data: participants } = await supabase
          .from("chat_participants")
          .select("operator_id, operators!inner(username)")
          .eq("room_id", room.id)
          .neq("operator_id", operatorId);

        const otherParticipant = participants && participants.length > 0 
          ? participants[0] 
          : null;

        return {
          ...room,
          lastMessage: lastMessage || null,
          unreadCount: unreadCount || 0,
          otherParticipant: otherParticipant
            ? {
                id: otherParticipant.operator_id,
                username: (otherParticipant.operators as any)?.username,
              }
            : null,
        };
      })
    );

    return NextResponse.json({ data: roomsWithDetails });
  } catch (error: any) {
    console.error("GET /api/chat/personal error:", error);
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }
}

