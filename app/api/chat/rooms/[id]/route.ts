import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET single chat room with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    const operatorId = request.headers.get("X-Operator-Id");

    // Get room details
    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (roomError) throw roomError;

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from("chat_messages")
      .select("*, chat_attachments(*)")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (messagesError) throw messagesError;

    // Update last_read_at for current operator
    if (operatorId) {
      await supabase
        .from("chat_participants")
        .upsert({
          room_id: roomId,
          operator_id: operatorId,
          last_read_at: new Date().toISOString(),
        });

      // Mark messages as read
      await supabase
        .from("chat_messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("room_id", roomId)
        .neq("sender_id", operatorId)
        .eq("is_read", false);
    }

    return NextResponse.json({ 
      data: {
        ...room,
        messages: messages || []
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update chat room (status, assigned_to, etc)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    const body = await request.json();
    const { status, assigned_to, priority } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (assigned_to) updateData.assigned_to = assigned_to;
    if (priority) updateData.priority = priority;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("chat_rooms")
      .update(updateData)
      .eq("id", roomId)
      .select()
      .single();

    if (error) throw error;

    // Create system message for status change
    if (status) {
      await supabase
        .from("chat_messages")
        .insert({
          room_id: roomId,
          sender_id: assigned_to || body.operator_id,
          message: `Status changed to: ${status}`,
          message_type: "system",
          is_read: false,
        });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

