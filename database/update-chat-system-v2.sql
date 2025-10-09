-- =====================================================
-- CHAT SYSTEM V2 - Enhanced with Personal & Group Chat
-- =====================================================
-- Adds support for:
-- - Personal chats (Super Admin <-> any operator)
-- - Group chats (multiple participants)
-- - Advanced permissions and restrictions
-- =====================================================

-- =====================================================
-- 1. DROP OLD POLICIES (Clean Slate)
-- =====================================================
DROP POLICY IF EXISTS "Enable all access for development" ON chat_rooms;
DROP POLICY IF EXISTS "Enable all access for development" ON chat_messages;
DROP POLICY IF EXISTS "Enable all access for development" ON chat_attachments;
DROP POLICY IF EXISTS "Enable all access for development" ON chat_participants;

-- =====================================================
-- 2. UPDATE chat_rooms TABLE - Add new room types
-- =====================================================
-- Drop old constraint and add new one
ALTER TABLE chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_room_type_check;
ALTER TABLE chat_rooms 
  ADD CONSTRAINT chat_rooms_room_type_check 
  CHECK (room_type IN ('support', 'personal', 'group'));

-- Add new columns for group chat
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS group_name VARCHAR(255);
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS group_admin UUID; -- Creator of group (Super Admin only)
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_chat_rooms_group_admin ON chat_rooms(group_admin);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_is_deleted ON chat_rooms(is_deleted);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_room_type ON chat_rooms(room_type);

-- Add comments
COMMENT ON COLUMN chat_rooms.room_type IS 'Type: support (operator request), personal (1-on-1 with admin), group (multi-participant)';
COMMENT ON COLUMN chat_rooms.group_name IS 'Name of group chat (only for room_type=group)';
COMMENT ON COLUMN chat_rooms.group_admin IS 'Super Admin who created the group';
COMMENT ON COLUMN chat_rooms.is_deleted IS 'Soft delete flag (Super Admin only)';

-- =====================================================
-- 3. UPDATE chat_participants TABLE - Add role tracking
-- =====================================================
ALTER TABLE chat_participants ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member';
ALTER TABLE chat_participants ADD COLUMN IF NOT EXISTS can_send_messages BOOLEAN DEFAULT true;
ALTER TABLE chat_participants ADD COLUMN IF NOT EXISTS added_by UUID;
ALTER TABLE chat_participants ADD COLUMN IF NOT EXISTS left_at TIMESTAMP WITH TIME ZONE;

-- Add constraint for role
ALTER TABLE chat_participants DROP CONSTRAINT IF EXISTS chat_participants_role_check;
ALTER TABLE chat_participants 
  ADD CONSTRAINT chat_participants_role_check 
  CHECK (role IN ('member', 'admin', 'super_admin'));

-- Add index
CREATE INDEX IF NOT EXISTS idx_chat_participants_role ON chat_participants(role);

-- Add comments
COMMENT ON COLUMN chat_participants.role IS 'Role in chat: member (regular operator), admin (can reply), super_admin (full control)';
COMMENT ON COLUMN chat_participants.can_send_messages IS 'Permission to send messages (admins only can reply in support chats)';
COMMENT ON COLUMN chat_participants.added_by IS 'Who added this participant (for group chats)';

-- =====================================================
-- 4. FUNCTION: Check if operator can send message
-- =====================================================
CREATE OR REPLACE FUNCTION can_operator_send_message(
  p_operator_id UUID, 
  p_room_id UUID,
  p_operator_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  room_type_val VARCHAR(50);
  is_super_admin BOOLEAN;
  is_admin BOOLEAN;
  is_participant BOOLEAN;
  can_send BOOLEAN;
BEGIN
  -- Check if operator is Super Admin or Admin
  is_super_admin := (p_operator_role = 'Super Admin');
  is_admin := (p_operator_role IN ('Super Admin', 'Admin'));
  
  -- Get room type
  SELECT room_type INTO room_type_val
  FROM chat_rooms
  WHERE id = p_room_id AND is_deleted = false;
  
  IF room_type_val IS NULL THEN
    RETURN false; -- Room not found or deleted
  END IF;
  
  -- Check if operator is participant
  SELECT EXISTS(
    SELECT 1 FROM chat_participants 
    WHERE room_id = p_room_id 
      AND operator_id = p_operator_id
      AND left_at IS NULL
  ) INTO is_participant;
  
  -- Permission logic based on room type
  CASE room_type_val
    WHEN 'support' THEN
      -- Support chat: Creator can always send, only admins can reply
      SELECT (created_by = p_operator_id OR is_admin) INTO can_send
      FROM chat_rooms
      WHERE id = p_room_id;
      
    WHEN 'personal' THEN
      -- Personal chat: Only participants can send
      can_send := is_participant;
      
    WHEN 'group' THEN
      -- Group chat: Only participants can send
      can_send := is_participant;
      
    ELSE
      can_send := false;
  END CASE;
  
  RETURN COALESCE(can_send, false);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. FUNCTION: Check if operator can create personal chat
-- =====================================================
CREATE OR REPLACE FUNCTION can_create_personal_chat(
  p_operator_id UUID,
  p_target_operator_id UUID,
  p_operator_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  is_super_admin BOOLEAN;
  target_is_super_admin BOOLEAN;
BEGIN
  -- Check if initiator is Super Admin
  is_super_admin := (p_operator_role = 'Super Admin');
  
  -- Get target operator role
  SELECT (operator_role_name = 'Super Admin') INTO target_is_super_admin
  FROM operators o
  LEFT JOIN operator_roles r ON o.operator_role_id = r.id
  WHERE o.id = p_target_operator_id;
  
  -- Logic:
  -- 1. Super Admin can chat with anyone
  -- 2. Regular operator can only initiate chat with Super Admin
  IF is_super_admin THEN
    RETURN true;
  ELSE
    RETURN COALESCE(target_is_super_admin, false);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. FUNCTION: Get or create personal chat room
-- =====================================================
CREATE OR REPLACE FUNCTION get_or_create_personal_chat(
  p_operator1_id UUID,
  p_operator2_id UUID,
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  existing_room_id UUID;
  new_room_id UUID;
BEGIN
  -- Check if personal chat already exists between these two operators
  SELECT r.id INTO existing_room_id
  FROM chat_rooms r
  INNER JOIN chat_participants p1 ON p1.room_id = r.id AND p1.operator_id = p_operator1_id
  INNER JOIN chat_participants p2 ON p2.room_id = r.id AND p2.operator_id = p_operator2_id
  WHERE r.room_type = 'personal'
    AND r.is_deleted = false
  LIMIT 1;
  
  IF existing_room_id IS NOT NULL THEN
    RETURN existing_room_id;
  END IF;
  
  -- Create new personal chat room
  INSERT INTO chat_rooms (room_type, subject, created_by, status)
  VALUES ('personal', 'Personal Chat', p_created_by, 'open')
  RETURNING id INTO new_room_id;
  
  -- Add both participants
  INSERT INTO chat_participants (room_id, operator_id, added_by)
  VALUES 
    (new_room_id, p_operator1_id, p_created_by),
    (new_room_id, p_operator2_id, p_created_by);
  
  RETURN new_room_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. FUNCTION: Updated unread count (exclude deleted rooms)
-- =====================================================
CREATE OR REPLACE FUNCTION get_unread_count(op_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT m.id) INTO unread_count
  FROM chat_messages m
  INNER JOIN chat_rooms r ON m.room_id = r.id
  LEFT JOIN chat_participants p ON p.room_id = r.id AND p.operator_id = op_id
  WHERE m.sender_id != op_id
    AND m.is_read = false
    AND r.is_deleted = false
    AND (
      r.created_by = op_id 
      OR r.assigned_to = op_id 
      OR EXISTS(
        SELECT 1 FROM chat_participants cp 
        WHERE cp.room_id = r.id 
          AND cp.operator_id = op_id
          AND cp.left_at IS NULL
      )
    )
    AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at);
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. FUNCTION: Soft delete chat room (Super Admin only)
-- =====================================================
CREATE OR REPLACE FUNCTION soft_delete_chat_room(
  p_room_id UUID,
  p_deleted_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE chat_rooms
  SET 
    is_deleted = true,
    deleted_at = NOW(),
    deleted_by = p_deleted_by
  WHERE id = p_room_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. RE-ENABLE RLS POLICIES (Permissive for now)
-- =====================================================
-- For development/testing: Allow all operations
-- TODO: In production, implement proper RLS based on operator roles

CREATE POLICY "Allow all for development" ON chat_rooms 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for development" ON chat_messages 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for development" ON chat_attachments 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for development" ON chat_participants 
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 10. CREATE VIEW: Operator chat list with unread counts
-- =====================================================
CREATE OR REPLACE VIEW v_operator_chat_rooms AS
SELECT 
  r.id,
  r.room_type,
  r.subject,
  r.group_name,
  r.status,
  r.priority,
  r.created_by,
  r.assigned_to,
  r.group_admin,
  r.last_message_at,
  r.created_at,
  r.is_deleted,
  -- Get last message preview
  (
    SELECT message 
    FROM chat_messages 
    WHERE room_id = r.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) as last_message,
  -- Count unread messages per room
  (
    SELECT COUNT(*) 
    FROM chat_messages m 
    WHERE m.room_id = r.id 
      AND m.is_read = false
  ) as unread_count,
  -- Get participant count
  (
    SELECT COUNT(*) 
    FROM chat_participants p 
    WHERE p.room_id = r.id 
      AND p.left_at IS NULL
  ) as participant_count
FROM chat_rooms r
WHERE r.is_deleted = false
ORDER BY r.last_message_at DESC;

-- =====================================================
-- 11. SAMPLE QUERIES FOR TESTING
-- =====================================================

-- Get all personal chats for an operator
-- SELECT * FROM v_operator_chat_rooms 
-- WHERE room_type = 'personal' 
--   AND id IN (
--     SELECT room_id FROM chat_participants 
--     WHERE operator_id = '<operator_id>' AND left_at IS NULL
--   );

-- Get all group chats
-- SELECT * FROM v_operator_chat_rooms WHERE room_type = 'group';

-- Create personal chat between two operators
-- SELECT get_or_create_personal_chat(
--   '<operator1_id>', 
--   '<operator2_id>', 
--   '<creator_id>'
-- );

-- Soft delete a chat room
-- SELECT soft_delete_chat_room('<room_id>', '<super_admin_id>');

-- =====================================================
-- END OF SCRIPT V2
-- =====================================================

