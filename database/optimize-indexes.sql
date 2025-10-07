-- Database Optimization: Indexes for Better Performance
-- Run this SQL in your Supabase SQL Editor to optimize query speed

-- =====================================================
-- ACCOUNTS TABLE INDEXES
-- =====================================================

-- Index for status filtering (used in dashboard and accounts page)
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);

-- Index for application filtering
CREATE INDEX IF NOT EXISTS idx_accounts_application_id ON accounts(application_id);

-- Index for line filtering
CREATE INDEX IF NOT EXISTS idx_accounts_line_id ON accounts(line_id);

-- Index for department filtering
CREATE INDEX IF NOT EXISTS idx_accounts_department_id ON accounts(department_id);

-- Index for role filtering
CREATE INDEX IF NOT EXISTS idx_accounts_role_id ON accounts(role_id);

-- Composite index for common queries (status + application)
CREATE INDEX IF NOT EXISTS idx_accounts_status_application ON accounts(status, application_id);

-- Composite index for common queries (status + line)
CREATE INDEX IF NOT EXISTS idx_accounts_status_line ON accounts(status, line_id);

-- Full-text search index for username
CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username);


-- =====================================================
-- ACTIVITY LOGS TABLE INDEXES
-- =====================================================

-- Index for action filtering
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- Index for table_name filtering
CREATE INDEX IF NOT EXISTS idx_activity_logs_table ON activity_logs(table_name);

-- Index for user_id (for operator activity tracking)
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- Index for created_at (for date range queries)
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Composite index for common audit log queries (action + table + date)
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_table_date ON activity_logs(action, table_name, created_at DESC);


-- =====================================================
-- OPERATORS TABLE INDEXES
-- =====================================================

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_operators_status ON operators(status);

-- Index for operator_role_id (for role-based queries)
CREATE INDEX IF NOT EXISTS idx_operators_role_id ON operators(operator_role_id);

-- Unique index for username (ensure no duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_operators_username_unique ON operators(username);


-- =====================================================
-- OPERATOR ROLES & PERMISSIONS INDEXES
-- =====================================================

-- Index for role status
CREATE INDEX IF NOT EXISTS idx_operator_roles_status ON operator_roles(status);

-- Index for role_id in permissions table
CREATE INDEX IF NOT EXISTS idx_operator_role_permissions_role_id ON operator_role_permissions(role_id);

-- Index for menu_name in permissions (for quick permission checks)
CREATE INDEX IF NOT EXISTS idx_operator_role_permissions_menu ON operator_role_permissions(menu_name);


-- =====================================================
-- APPLICATIONS, LINES, DEPARTMENTS, ROLES INDEXES
-- =====================================================

-- These are smaller tables but still benefit from indexes

CREATE INDEX IF NOT EXISTS idx_applications_app_code ON applications(app_code);
CREATE INDEX IF NOT EXISTS idx_lines_line_code ON lines(line_code);
CREATE INDEX IF NOT EXISTS idx_departments_department_code ON departments(department_code);
CREATE INDEX IF NOT EXISTS idx_roles_role_code ON roles(role_code);


-- =====================================================
-- ANALYZE TABLES (Update Statistics)
-- =====================================================

-- After creating indexes, analyze tables to update query planner statistics
ANALYZE accounts;
ANALYZE activity_logs;
ANALYZE operators;
ANALYZE operator_roles;
ANALYZE operator_role_permissions;
ANALYZE applications;
ANALYZE lines;
ANALYZE departments;
ANALYZE roles;


-- =====================================================
-- VACUUM (Optional - Cleanup)
-- =====================================================

-- Run VACUUM to reclaim storage and optimize table performance
-- Note: This may take some time depending on table size
-- VACUUM ANALYZE accounts;
-- VACUUM ANALYZE activity_logs;


-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all indexes created
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

