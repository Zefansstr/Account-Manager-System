import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST send new message
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { room_id, sender_id, message, message_type } = body;

    if (!room_id || !sender_id || !message) {
      return NextResponse.json(
        { error: "room_id, sender_id, and message are required" },
        { status: 400 }
      );
    }

    // Get sender's role
    const { data: sender, error: senderError } = await supabase
      .from("operators")
      .select("id, operator_roles!inner(role_name)")
      .eq("id", sender_id)
      .single();

    if (senderError) {
      return NextResponse.json(
        { error: "Sender not found" },
        { status: 404 }
      );
    }

    const senderRole = (sender?.operator_roles as any)?.role_name;
    const isSenderAdmin = senderRole === "Super Admin" || senderRole === "Admin";

    // Get room details
    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .select("id, room_type, created_by, is_deleted")
      .eq("id", room_id)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: "Chat room not found" },
        { status: 404 }
      );
    }

    if (room.is_deleted) {
      return NextResponse.json(
        { error: "This chat has been deleted" },
        { status: 410 }
      );
    }

    // Permission check based on room type
    let canSend = false;

    if (room.room_type === "support") {
      // Support chat: Creator can always send, only admins can reply
      canSend = (room.created_by === sender_id) || isSenderAdmin;
    } else if (room.room_type === "personal" || room.room_type === "group") {
      // Personal/Group chat: Check if sender is participant
      const { data: participation } = await supabase
        .from("chat_participants")
        .select("operator_id, can_send_messages, left_at")
        .eq("room_id", room_id)
        .eq("operator_id", sender_id)
        .is("left_at", null)
        .single();

      canSend = participation && participation.can_send_messages;
    }

    if (!canSend) {
      return NextResponse.json(
        { error: "You don't have permission to send messages in this chat" },
        { status: 403 }
      );
    }

    // Insert message
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        room_id,
        sender_id,
        message,
        message_type: message_type || "text",
        is_read: false,
      })
      .select("*")
      .single();

    if (error) throw error;

    // Update sender's last_read_at
    await supabase
      .from("chat_participants")
      .update({
        last_read_at: new Date().toISOString(),
      })
      .eq("room_id", room_id)
      .eq("operator_id", sender_id);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/chat/messages error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

