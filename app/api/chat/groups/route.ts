import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST - Create new group chat (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { group_name, description, created_by, participant_ids } = body;

    if (!group_name || !created_by || !participant_ids || participant_ids.length === 0) {
      return NextResponse.json(
        { error: "group_name, created_by, and participant_ids are required" },
        { status: 400 }
      );
    }

    // Check if creator is Super Admin
    const { data: creator, error: creatorError } = await supabase
      .from("operators")
      .select("id, operator_roles!inner(role_name)")
      .eq("id", created_by)
      .single();

    if (creatorError) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      );
    }

    const creatorRole = (creator?.operator_roles as any)?.role_name;
    const isCreatorSuperAdmin = creatorRole === "Super Admin";

    if (!isCreatorSuperAdmin) {
      return NextResponse.json(
        { error: "Only Super Admin can create group chats" },
        { status: 403 }
      );
    }

    // Create group chat room
    const { data: newGroup, error: groupError } = await supabase
      .from("chat_rooms")
      .insert({
        room_type: "group",
        group_name,
        subject: group_name,
        description,
        created_by,
        group_admin: created_by,
        status: "open",
      })
      .select()
      .single();

    if (groupError) {
      console.error("Error creating group:", groupError);
      throw groupError;
    }

    // Get participant roles to assign appropriate chat roles
    const { data: participantOperators, error: participantsError } = await supabase
      .from("operators")
      .select("id, operator_roles!inner(role_name)")
      .in("id", [...participant_ids, created_by]);

    if (participantsError) {
      console.error("Error fetching participants:", participantsError);
      throw participantsError;
    }

    const operatorRoleMap = new Map(
      participantOperators?.map(op => [
        op.id,
        (op.operator_roles as any)?.role_name
      ]) || []
    );

    // Add all participants including creator
    const uniqueParticipantIds = Array.from(new Set([created_by, ...participant_ids]));
    const participantsToAdd = uniqueParticipantIds.map(opId => ({
      room_id: newGroup.id,
      operator_id: opId,
      role: operatorRoleMap.get(opId) === "Super Admin" 
        ? "super_admin" 
        : operatorRoleMap.get(opId) === "Admin"
        ? "admin"
        : "member",
      added_by: created_by,
    }));

    const { error: addParticipantsError } = await supabase
      .from("chat_participants")
      .insert(participantsToAdd);

    if (addParticipantsError) {
      console.error("Error adding participants:", addParticipantsError);
      throw addParticipantsError;
    }

    // Create system message
    await supabase
      .from("chat_messages")
      .insert({
        room_id: newGroup.id,
        sender_id: created_by,
        message: `Group "${group_name}" created with ${uniqueParticipantIds.length} members`,
        message_type: "system",
        is_read: false,
      });

    return NextResponse.json({ data: newGroup }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/chat/groups error:", error);
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }
}

// GET - List all group chats for current operator
export async function GET(request: NextRequest) {
  try {
    const operatorId = request.headers.get("X-Operator-Id");

    if (!operatorId) {
      return NextResponse.json({ error: "Operator ID required" }, { status: 401 });
    }

    // Get operator role to determine access
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

    let query = supabase
      .from("chat_rooms")
      .select(`
        id,
        room_type,
        group_name,
        subject,
        description,
        status,
        created_by,
        group_admin,
        created_at,
        last_message_at,
        chat_participants!inner(operator_id, role)
      `)
      .eq("room_type", "group")
      .eq("is_deleted", false)
      .order("last_message_at", { ascending: false });

    // If not Super Admin, only show groups where operator is participant
    if (!isSuperAdmin) {
      query = query.eq("chat_participants.operator_id", operatorId);
    }

    const { data: groups, error } = await query;

    if (error) {
      console.error("Error fetching groups:", error);
      throw error;
    }

    // Get additional info for each group
    const groupsWithDetails = await Promise.all(
      (groups || []).map(async (group: any) => {
        // Get last message
        const { data: lastMessage } = await supabase
          .from("chat_messages")
          .select("message, created_at, sender_id")
          .eq("room_id", group.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count: unreadCount } = await supabase
          .from("chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("room_id", group.id)
          .eq("is_read", false)
          .neq("sender_id", operatorId);

        // Get participant count
        const { count: participantCount } = await supabase
          .from("chat_participants")
          .select("operator_id", { count: "exact", head: true })
          .eq("room_id", group.id)
          .is("left_at", null);

        // Get group admin info
        const { data: adminInfo } = await supabase
          .from("operators")
          .select("id, username")
          .eq("id", group.group_admin)
          .single();

        return {
          ...group,
          lastMessage: lastMessage || null,
          unreadCount: unreadCount || 0,
          participantCount: participantCount || 0,
          admin: adminInfo || null,
        };
      })
    );

    return NextResponse.json({ data: groupsWithDetails });
  } catch (error: any) {
    console.error("GET /api/chat/groups error:", error);
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }
}

