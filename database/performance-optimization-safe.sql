-- =====================================================
-- DATABASE PERFORMANCE OPTIMIZATION (SAFE VERSION)
-- =====================================================
-- This version checks if tables exist before creating indexes
-- Run this script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. OPERATORS SYSTEM INDEXES (Core tables only)
-- =====================================================

-- Check if operators table exists and create indexes
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'operators') THEN
        CREATE INDEX IF NOT EXISTS idx_operators_username ON operators(username);
        CREATE INDEX IF NOT EXISTS idx_operators_operator_role_id ON operators(operator_role_id);
        CREATE INDEX IF NOT EXISTS idx_operators_status ON operators(status);
        CREATE INDEX IF NOT EXISTS idx_operators_last_login ON operators(last_login);
        CREATE INDEX IF NOT EXISTS idx_operators_created_at ON operators(created_at);
        RAISE NOTICE '✅ Operators indexes created';
    ELSE
        RAISE NOTICE '⏭️ Skipping operators - table does not exist';
    END IF;
END $$;

-- Operator roles indexes
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'operator_roles') THEN
        CREATE INDEX IF NOT EXISTS idx_operator_roles_status ON operator_roles(status);
        CREATE INDEX IF NOT EXISTS idx_operator_roles_created_at ON operator_roles(created_at);
        RAISE NOTICE '✅ Operator roles indexes created';
    ELSE
        RAISE NOTICE '⏭️ Skipping operator_roles - table does not exist';
    END IF;
END $$;

-- Operator role permissions indexes
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'operator_role_permissions') THEN
        CREATE INDEX IF NOT EXISTS idx_operator_role_permissions_role_id ON operator_role_permissions(role_id);
        CREATE INDEX IF NOT EXISTS idx_operator_role_permissions_menu_name ON operator_role_permissions(menu_name);
        CREATE INDEX IF NOT EXISTS idx_operator_role_permissions_composite ON operator_role_permissions(role_id, menu_name);
        RAISE NOTICE '✅ Operator role permissions indexes created';
    ELSE
        RAISE NOTICE '⏭️ Skipping operator_role_permissions - table does not exist';
    END IF;
END $$;

-- =====================================================
-- 2. CHAT SYSTEM INDEXES (CRITICAL FOR PERFORMANCE)
-- =====================================================

-- Chat rooms indexes
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_rooms') THEN
        CREATE INDEX IF NOT EXISTS idx_chat_rooms_room_type ON chat_rooms(room_type);
        CREATE INDEX IF NOT EXISTS idx_chat_rooms_status ON chat_rooms(status);
        CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON chat_rooms(created_by);
        CREATE INDEX IF NOT EXISTS idx_chat_rooms_assigned_to ON chat_rooms(assigned_to);
        CREATE INDEX IF NOT EXISTS idx_chat_rooms_is_deleted ON chat_rooms(is_deleted) WHERE is_deleted = false;
        CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_at ON chat_rooms(created_at DESC);
        RAISE NOTICE '✅ Chat rooms indexes created';
    ELSE
        RAISE NOTICE '⏭️ Skipping chat_rooms - table does not exist';
    END IF;
END $$;

-- Chat messages indexes (MOST CRITICAL)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages') THEN
        CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read) WHERE is_read = false;
        CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC);
        RAISE NOTICE '✅ Chat messages indexes created';
    ELSE
        RAISE NOTICE '⏭️ Skipping chat_messages - table does not exist';
    END IF;
END $$;

-- Chat participants indexes
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_participants') THEN
        CREATE INDEX IF NOT EXISTS idx_chat_participants_room_id ON chat_participants(room_id);
        CREATE INDEX IF NOT EXISTS idx_chat_participants_operator_id ON chat_participants(operator_id);
        CREATE INDEX IF NOT EXISTS idx_chat_participants_composite ON chat_participants(operator_id, room_id);
        CREATE INDEX IF NOT EXISTS idx_chat_participants_last_read ON chat_participants(last_read_at);
        CREATE INDEX IF NOT EXISTS idx_chat_participants_active ON chat_participants(operator_id, room_id) WHERE left_at IS NULL;
        RAISE NOTICE '✅ Chat participants indexes created';
    ELSE
        RAISE NOTICE '⏭️ Skipping chat_participants - table does not exist';
    END IF;
END $$;

-- Chat attachments indexes
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_attachments') THEN
        CREATE INDEX IF NOT EXISTS idx_chat_attachments_message_id ON chat_attachments(message_id);
        CREATE INDEX IF NOT EXISTS idx_chat_attachments_uploaded_by ON chat_attachments(uploaded_by);
        RAISE NOTICE '✅ Chat attachments indexes created';
    ELSE
        RAISE NOTICE '⏭️ Skipping chat_attachments - table does not exist';
    END IF;
END $$;

-- =====================================================
-- 3. AUDIT LOGS INDEXES
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_activity_logs_action_created ON activity_logs(action, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_activity_logs_table_created ON activity_logs(table_name, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_activity_logs_record_table ON activity_logs(record_id, table_name);
        RAISE NOTICE '✅ Activity logs indexes created';
    ELSE
        RAISE NOTICE '⏭️ Skipping activity_logs - table does not exist';
    END IF;
END $$;

-- =====================================================
-- 4. MASTER DATA INDEXES
-- =====================================================

-- Applications
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'applications') THEN
        CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status) WHERE status = 'active';
        CREATE INDEX IF NOT EXISTS idx_applications_app_code ON applications(app_code);
        RAISE NOTICE '✅ Applications indexes created';
    ELSE
        RAISE NOTICE '⏭️ Skipping applications - table does not exist';
    END IF;
END $$;

-- Lines
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lines') THEN
        CREATE INDEX IF NOT EXISTS idx_lines_status ON lines(status) WHERE status = 'active';
        CREATE INDEX IF NOT EXISTS idx_lines_line_code ON lines(line_code);
        RAISE NOTICE '✅ Lines indexes created';
    ELSE
        RAISE NOTICE '⏭️ Skipping lines - table does not exist';
    END IF;
END $$;

-- Departments
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'departments') THEN
        CREATE INDEX IF NOT EXISTS idx_departments_department_code ON departments(department_code);
        RAISE NOTICE '✅ Departments indexes created';
    ELSE
        RAISE NOTICE '⏭️ Skipping departments - table does not exist';
    END IF;
END $$;

-- Roles
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'roles') THEN
        CREATE INDEX IF NOT EXISTS idx_roles_role_code ON roles(role_code);
        RAISE NOTICE '✅ Roles indexes created';
    ELSE
        RAISE NOTICE '⏭️ Skipping roles - table does not exist';
    END IF;
END $$;

-- =====================================================
-- 5. ACCOUNTS TABLE INDEXES
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'accounts') THEN
        -- Composite indexes for common filter combinations
        CREATE INDEX IF NOT EXISTS idx_accounts_status_created ON accounts(status, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_accounts_app_status ON accounts(application_id, status);
        CREATE INDEX IF NOT EXISTS idx_accounts_line_status ON accounts(line_id, status);
        CREATE INDEX IF NOT EXISTS idx_accounts_dept_status ON accounts(department_id, status);
        
        -- Full-text search
        CREATE INDEX IF NOT EXISTS idx_accounts_username_gin ON accounts USING gin(to_tsvector('english', username));
        
        RAISE NOTICE '✅ Accounts indexes created';
    ELSE
        RAISE NOTICE '⏭️ Skipping accounts - table does not exist';
    END IF;
END $$;

-- =====================================================
-- 6. FULL-TEXT SEARCH FOR CHAT
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages') THEN
        CREATE INDEX IF NOT EXISTS idx_chat_messages_content_gin ON chat_messages USING gin(to_tsvector('english', message));
        RAISE NOTICE '✅ Chat messages full-text search index created';
    END IF;
END $$;

-- =====================================================
-- 7. ANALYZE TABLES TO UPDATE STATISTICS
-- =====================================================

DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'accounts', 'operators', 'operator_roles', 'operator_role_permissions',
            'chat_rooms', 'chat_messages', 'chat_participants', 'chat_attachments',
            'activity_logs', 'applications', 'lines', 'departments', 'roles'
        )
    LOOP
        EXECUTE format('ANALYZE %I', table_record.tablename);
        RAISE NOTICE '✅ Analyzed table: %', table_record.tablename;
    END LOOP;
END $$;

-- =====================================================
-- OPTIMIZATION COMPLETE!
-- =====================================================

SELECT 
    '🎉 Database optimization completed!' as status,
    count(*) as total_indexes_created
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';

