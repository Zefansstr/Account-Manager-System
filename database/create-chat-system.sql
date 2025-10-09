-- =====================================================
-- CHAT SUPPORT SYSTEM - Database Schema
-- =====================================================
-- Real-time chat support system dengan file attachments
-- Run this script di Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. TABLE: chat_rooms (Support Chat Rooms)
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_type VARCHAR(50) DEFAULT 'support' CHECK (room_type IN ('support', 'direct')),
  subject VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_by UUID NOT NULL, -- operator_id yang buat chat
  assigned_to UUID, -- Super Admin/Admin yang handle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_assigned_to ON chat_rooms(assigned_to);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_status ON chat_rooms(status);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message_at ON chat_rooms(last_message_at DESC);

-- Add comments
COMMENT ON TABLE chat_rooms IS 'Support chat rooms between operators and admins';
COMMENT ON COLUMN chat_rooms.room_type IS 'Type of chat: support (user to admin) or direct (user to user)';
COMMENT ON COLUMN chat_rooms.status IS 'Chat status: open, in_progress, resolved, closed';
COMMENT ON COLUMN chat_rooms.created_by IS 'Operator ID who created the chat';
COMMENT ON COLUMN chat_rooms.assigned_to IS 'Admin/Super Admin ID who handles the chat';

-- =====================================================
-- 2. TABLE: chat_messages (Chat Messages)
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL, -- operator_id
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'attachment')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read);

-- Add comments
COMMENT ON TABLE chat_messages IS 'Individual messages in chat rooms';
COMMENT ON COLUMN chat_messages.message_type IS 'Type: text (normal message), system (status change), attachment (file)';
COMMENT ON COLUMN chat_messages.is_read IS 'Whether message has been read by recipient';

-- =====================================================
-- 3. TABLE: chat_attachments (File Attachments)
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  file_name VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER, -- in bytes
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_attachments_message_id ON chat_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_uploaded_by ON chat_attachments(uploaded_by);

-- Add comments
COMMENT ON TABLE chat_attachments IS 'File attachments in chat messages (images, documents, etc)';

-- =====================================================
-- 4. TABLE: chat_participants (Who's in the room)
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_participants (
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (room_id, operator_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_participants_operator_id ON chat_participants(operator_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_last_read_at ON chat_participants(last_read_at);

-- Add comments
COMMENT ON TABLE chat_participants IS 'Track who participates in each chat room and their read status';

-- =====================================================
-- 5. FUNCTION: Update last_message_at when new message
-- =====================================================
CREATE OR REPLACE FUNCTION update_chat_room_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_rooms 
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_chat_room_last_message ON chat_messages;
CREATE TRIGGER trigger_update_chat_room_last_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_room_last_message();

-- =====================================================
-- 6. FUNCTION: Get unread message count for operator
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
    AND (r.created_by = op_id OR r.assigned_to = op_id)
    AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at);
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;

-- For development: Allow all operations
CREATE POLICY "Enable all access for development" ON chat_rooms FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON chat_messages FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON chat_attachments FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON chat_participants FOR ALL USING (true);

-- =====================================================
-- 8. ADD CHAT SUPPORT MENU TO MENUS (if not exists)
-- =====================================================
-- This will be used for permission management
-- Run this only if you want to track it in your menus table
-- (Optional, depends on your permission structure)

-- =====================================================
-- 9. SAMPLE DATA (Optional for testing)
-- =====================================================
-- Insert sample chat room
-- INSERT INTO chat_rooms (subject, description, created_by, status, priority) VALUES
--   ('Account Activation Request', 'Need to activate my SBMY account', '<operator_id>', 'open', 'high');

-- =====================================================
-- 10. USEFUL QUERIES
-- =====================================================

-- Get all active support chats
-- SELECT 
--   r.id,
--   r.subject,
--   r.status,
--   r.priority,
--   r.created_by,
--   r.assigned_to,
--   r.last_message_at,
--   COUNT(m.id) FILTER (WHERE m.is_read = false) as unread_count
-- FROM chat_rooms r
-- LEFT JOIN chat_messages m ON m.room_id = r.id
-- WHERE r.status IN ('open', 'in_progress')
-- GROUP BY r.id
-- ORDER BY r.last_message_at DESC;

-- Get messages for a room
-- SELECT 
--   m.id,
--   m.message,
--   m.message_type,
--   m.sender_id,
--   m.created_at,
--   m.is_read
-- FROM chat_messages m
-- WHERE m.room_id = '<room_id>'
-- ORDER BY m.created_at ASC;

-- Get unread count for an operator
-- SELECT get_unread_count('<operator_id>');

-- =====================================================
-- END OF SCRIPT
-- =====================================================

