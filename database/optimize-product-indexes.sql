-- =====================================================
-- Product Management - Database Indexes for Performance
-- =====================================================
-- Run this SQL in Supabase SQL Editor to optimize Product Management queries
-- =====================================================

-- PRODUCT_ACCOUNTS TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_product_accounts_application_id ON product_accounts(application_id);
CREATE INDEX IF NOT EXISTS idx_product_accounts_line_id ON product_accounts(line_id);
CREATE INDEX IF NOT EXISTS idx_product_accounts_department_id ON product_accounts(department_id);
CREATE INDEX IF NOT EXISTS idx_product_accounts_role_id ON product_accounts(role_id);
CREATE INDEX IF NOT EXISTS idx_product_accounts_status ON product_accounts(status);
CREATE INDEX IF NOT EXISTS idx_product_accounts_username ON product_accounts(username);
CREATE INDEX IF NOT EXISTS idx_product_accounts_created_at ON product_accounts(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_product_accounts_status_application ON product_accounts(status, application_id);
CREATE INDEX IF NOT EXISTS idx_product_accounts_status_line ON product_accounts(status, line_id);

-- PRODUCT_APPLICATIONS TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_product_applications_app_code ON product_applications(app_code);
CREATE INDEX IF NOT EXISTS idx_product_applications_status ON product_applications(status);
CREATE INDEX IF NOT EXISTS idx_product_applications_created_at ON product_applications(created_at DESC);

-- PRODUCT_LINES TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_product_lines_line_code ON product_lines(line_code);
CREATE INDEX IF NOT EXISTS idx_product_lines_status ON product_lines(status);
CREATE INDEX IF NOT EXISTS idx_product_lines_created_at ON product_lines(created_at DESC);

-- PRODUCT_DEPARTMENTS TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_product_departments_department_code ON product_departments(department_code);
CREATE INDEX IF NOT EXISTS idx_product_departments_created_at ON product_departments(created_at DESC);

-- PRODUCT_ROLES TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_product_roles_role_code ON product_roles(role_code);
CREATE INDEX IF NOT EXISTS idx_product_roles_created_at ON product_roles(created_at DESC);

-- =====================================================
-- ANALYZE TABLES (Update Statistics)
-- =====================================================
ANALYZE product_accounts;
ANALYZE product_applications;
ANALYZE product_lines;
ANALYZE product_departments;
ANALYZE product_roles;
