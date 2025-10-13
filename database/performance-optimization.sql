-- =====================================================
-- DATABASE PERFORMANCE OPTIMIZATION
-- =====================================================
-- Phase 1: Foundation Optimizations
-- Run this script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. MISSING INDEXES FOR OPERATORS SYSTEM
-- =====================================================

-- Operators table indexes
CREATE INDEX IF NOT EXISTS idx_operators_username ON operators(username);
CREATE INDEX IF NOT EXISTS idx_operators_operator_role_id ON operators(operator_role_id);
CREATE INDEX IF NOT EXISTS idx_operators_status ON operators(status);
CREATE INDEX IF NOT EXISTS idx_operators_last_login ON operators(last_login);
CREATE INDEX IF NOT EXISTS idx_operators_created_at ON operators(created_at);

-- Operator roles indexes
CREATE INDEX IF NOT EXISTS idx_operator_roles_status ON operator_roles(status);
CREATE INDEX IF NOT EXISTS idx_operator_roles_created_at ON operator_roles(created_at);

-- Operator role permissions indexes (CRITICAL for permissions check)
CREATE INDEX IF NOT EXISTS idx_operator_role_permissions_role_id ON operator_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_operator_role_permissions_menu_name ON operator_role_permissions(menu_name);
CREATE INDEX IF NOT EXISTS idx_operator_role_permissions_composite ON operator_role_permissions(role_id, menu_name);

-- Operator individual permissions indexes (SKIP if table doesn't exist)
-- Uncomment when operator_permissions table is created:
-- CREATE INDEX IF NOT EXISTS idx_operator_permissions_operator_id ON operator_permissions(operator_id);
-- CREATE INDEX IF NOT EXISTS idx_operator_permissions_menu_name ON operator_permissions(menu_name);
-- CREATE INDEX IF NOT EXISTS idx_operator_permissions_composite ON operator_permissions(operator_id, menu_name);

-- =====================================================
-- 2. CHAT SYSTEM INDEXES (CRITICAL FOR PERFORMANCE)
-- =====================================================

-- Chat rooms indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_room_type ON chat_rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_status ON chat_rooms(status);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_assigned_to ON chat_rooms(assigned_to);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_is_deleted ON chat_rooms(is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_at ON chat_rooms(created_at DESC);

-- Chat messages indexes (MOST CRITICAL - queried heavily)
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC);

-- Chat participants indexes (CRITICAL for unread count)
CREATE INDEX IF NOT EXISTS idx_chat_participants_room_id ON chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_operator_id ON chat_participants(operator_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_composite ON chat_participants(operator_id, room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_last_read ON chat_participants(last_read_at);
CREATE INDEX IF NOT EXISTS idx_chat_participants_active ON chat_participants(operator_id, room_id) WHERE left_at IS NULL;

-- Chat attachments indexes
CREATE INDEX IF NOT EXISTS idx_chat_attachments_message_id ON chat_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_uploaded_by ON chat_attachments(uploaded_by);

-- =====================================================
-- 3. AUDIT LOGS INDEXES (CRITICAL FOR FILTERING)
-- =====================================================

-- Activity logs - composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_created ON activity_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_table_created ON activity_logs(table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_record_table ON activity_logs(record_id, table_name);

-- =====================================================
-- 4. MASTER DATA INDEXES (For dropdowns & lookups)
-- =====================================================

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_applications_app_code ON applications(app_code);

-- Lines indexes
CREATE INDEX IF NOT EXISTS idx_lines_status ON lines(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_lines_line_code ON lines(line_code);

-- Departments indexes
CREATE INDEX IF NOT EXISTS idx_departments_department_code ON departments(department_code);

-- Roles indexes
CREATE INDEX IF NOT EXISTS idx_roles_role_code ON roles(role_code);

-- =====================================================
-- 5. COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =====================================================

-- Accounts - common filter combinations
CREATE INDEX IF NOT EXISTS idx_accounts_status_created ON accounts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounts_app_status ON accounts(application_id, status);
CREATE INDEX IF NOT EXISTS idx_accounts_line_status ON accounts(line_id, status);
CREATE INDEX IF NOT EXISTS idx_accounts_dept_status ON accounts(department_id, status);

-- Chat rooms - unread messages query optimization
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread_by_room ON chat_messages(room_id, is_read, created_at DESC) WHERE is_read = false;

-- =====================================================
-- 6. FULL-TEXT SEARCH INDEXES (For search features)
-- =====================================================

-- Add GIN indexes for text search
CREATE INDEX IF NOT EXISTS idx_accounts_username_gin ON accounts USING gin(to_tsvector('english', username));
CREATE INDEX IF NOT EXISTS idx_chat_messages_content_gin ON chat_messages USING gin(to_tsvector('english', message));

-- =====================================================
-- 7. QUERY OPTIMIZATION - UPDATE STATISTICS
-- =====================================================

-- Analyze tables to update statistics for query planner
ANALYZE accounts;
ANALYZE operators;
ANALYZE operator_roles;
ANALYZE operator_role_permissions;
ANALYZE operator_permissions;
ANALYZE chat_rooms;
ANALYZE chat_messages;
ANALYZE chat_participants;
ANALYZE activity_logs;
ANALYZE applications;
ANALYZE lines;
ANALYZE departments;
ANALYZE roles;

-- =====================================================
-- 8. VACUUM FULL (Optional - run during low traffic)
-- =====================================================
-- Uncomment and run during maintenance window:
-- VACUUM FULL accounts;
-- VACUUM FULL chat_messages;
-- VACUUM FULL activity_logs;

-- =====================================================
-- 9. CHECK INDEX USAGE (Diagnostic Query)
-- =====================================================
-- Run this to see which indexes are being used:
/*
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC, idx_tup_read DESC;
*/

-- =====================================================
-- 10. SLOW QUERY DETECTION (Diagnostic)
-- =====================================================
-- Run this to find slow queries (requires pg_stat_statements extension):
/*
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
*/

-- =====================================================
-- OPTIMIZATION COMPLETE!
-- =====================================================
-- Expected improvements:
-- ✅ Chat queries: 5-10x faster
-- ✅ Permissions check: 3-5x faster
-- ✅ Audit logs filtering: 10x faster
-- ✅ Search operations: 3-5x faster
-- ✅ Dashboard KPIs: 2-3x faster
-- =====================================================

