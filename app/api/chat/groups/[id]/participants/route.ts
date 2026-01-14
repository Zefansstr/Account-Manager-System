import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST - Add participant to group (Super Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const body = await request.json();
    const { operator_id, participant_id } = body;

    if (!operator_id || !participant_id) {
      return NextResponse.json(
        { error: "operator_id and participant_id are required" },
        { status: 400 }
      );
    }

    // Check if operator is Super Admin
    const { data: operator, error: opError } = await supabase
      .from("operators")
      .select("id, operator_roles!inner(role_name)")
      .eq("id", operator_id)
      .single();

    if (opError) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 });
    }

    const operatorRole = (operator?.operator_roles as any)?.role_name;
    const isSuperAdmin = operatorRole === "Super Admin";

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Only Super Admin can add participants" },
        { status: 403 }
      );
    }

    // Check if participant exists
    const { data: participant, error: participantError } = await supabase
      .from("operators")
      .select("id, username, operator_roles!inner(role_name)")
      .eq("id", participant_id)
      .single();

    if (participantError) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    const participantRole = (participant?.operator_roles as any)?.role_name;

    // Check if already participant
    const { data: existingParticipant } = await supabase
      .from("chat_participants")
      .select("operator_id")
      .eq("room_id", groupId)
      .eq("operator_id", participant_id)
      .is("left_at", null)
      .single();

    if (existingParticipant) {
      return NextResponse.json(
        { error: "Operator is already a participant" },
        { status: 400 }
      );
    }

    // Add participant
    const chatRole = 
      participantRole === "Super Admin" ? "super_admin" :
      participantRole === "Admin" ? "admin" :
      "member";

    const { data: newParticipant, error: addError } = await supabase
      .from("chat_participants")
      .insert({
        room_id: groupId,
        operator_id: participant_id,
        role: chatRole,
        added_by: operator_id,
      })
      .select()
      .single();

    if (addError) {
      console.error("Error adding participant:", addError);
      throw addError;
    }

    // Create system message
    await supabase
      .from("chat_messages")
      .insert({
        room_id: groupId,
        sender_id: operator_id,
        message: `${participant.username} was added to the group`,
        message_type: "system",
        is_read: false,
      });

    return NextResponse.json({ data: newParticipant }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/chat/groups/[id]/participants error:", error);
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }
}

// DELETE - Remove participant from group (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const { searchParams } = new URL(request.url);
    const operatorId = searchParams.get("operator_id");
    const participantId = searchParams.get("participant_id");

    if (!operatorId || !participantId) {
      return NextResponse.json(
        { error: "operator_id and participant_id are required" },
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
        { error: "Only Super Admin can remove participants" },
        { status: 403 }
      );
    }

    // Get participant username for system message
    const { data: participant } = await supabase
      .from("operators")
      .select("username")
      .eq("id", participantId)
      .single();

    // Mark participant as left (soft delete)
    const { error: removeError } = await supabase
      .from("chat_participants")
      .update({
        left_at: new Date().toISOString(),
      })
      .eq("room_id", groupId)
      .eq("operator_id", participantId);

    if (removeError) {
      console.error("Error removing participant:", removeError);
      throw removeError;
    }

    // Create system message
    await supabase
      .from("chat_messages")
      .insert({
        room_id: groupId,
        sender_id: operatorId,
        message: `${participant?.username || "A participant"} was removed from the group`,
        message_type: "system",
        is_read: false,
      });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/chat/groups/[id]/participants error:", error);
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }
}

