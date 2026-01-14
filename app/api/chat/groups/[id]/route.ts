import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET - Get group details with participants
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const operatorId = request.headers.get("X-Operator-Id");

    if (!operatorId) {
      return NextResponse.json({ error: "Operator ID required" }, { status: 401 });
    }

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from("chat_rooms")
      .select("*")
      .eq("id", groupId)
      .eq("room_type", "group")
      .eq("is_deleted", false)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Get all participants with their operator info
    const { data: participants, error: participantsError } = await supabase
      .from("chat_participants")
      .select(`
        operator_id,
        role,
        joined_at,
        can_send_messages,
        left_at,
        operators!inner(id, username, email, operator_roles!inner(role_name))
      `)
      .eq("room_id", groupId)
      .is("left_at", null);

    if (participantsError) {
      console.error("Error fetching participants:", participantsError);
      throw participantsError;
    }

    return NextResponse.json({
      data: {
        ...group,
        participants: participants || [],
      },
    });
  } catch (error: any) {
    console.error("GET /api/chat/groups/[id] error:", error);
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }
}

// PATCH - Update group (Super Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const body = await request.json();
    const { operator_id, group_name, description } = body;

    if (!operator_id) {
      return NextResponse.json(
        { error: "operator_id is required" },
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
        { error: "Only Super Admin can update groups" },
        { status: 403 }
      );
    }

    // Update group
    const updateData: any = {};
    if (group_name) updateData.group_name = group_name;
    if (description) updateData.description = description;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedGroup, error: updateError } = await supabase
      .from("chat_rooms")
      .update(updateData)
      .eq("id", groupId)
      .eq("room_type", "group")
      .select()
      .single();

    if (updateError) {
      console.error("Error updating group:", updateError);
      throw updateError;
    }

    return NextResponse.json({ data: updatedGroup });
  } catch (error: any) {
    console.error("PATCH /api/chat/groups/[id] error:", error);
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete group (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const operatorId = request.headers.get("X-Operator-Id");

    if (!operatorId) {
      return NextResponse.json({ error: "Operator ID required" }, { status: 401 });
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
        { error: "Only Super Admin can delete groups" },
        { status: 403 }
      );
    }

    // Soft delete the group
    const { error: deleteError } = await supabase
      .from("chat_rooms")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: operatorId,
      })
      .eq("id", groupId)
      .eq("room_type", "group");

    if (deleteError) {
      console.error("Error deleting group:", deleteError);
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/chat/groups/[id] error:", error);
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }
}

