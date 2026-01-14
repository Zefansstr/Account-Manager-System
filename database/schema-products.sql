-- =====================================================
-- Product Management System - Database Schema
-- =====================================================
-- Run this script di Supabase SQL Editor
-- =====================================================

-- 1. TABLE: product_applications
-- =====================================================
CREATE TABLE IF NOT EXISTS product_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_code VARCHAR(50) UNIQUE NOT NULL,
  app_name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TABLE: product_lines
-- =====================================================
CREATE TABLE IF NOT EXISTS product_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  line_code VARCHAR(50) UNIQUE NOT NULL,
  line_name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TABLE: product_departments
-- =====================================================
CREATE TABLE IF NOT EXISTS product_departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department_code VARCHAR(50) UNIQUE NOT NULL,
  department_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TABLE: product_roles
-- =====================================================
CREATE TABLE IF NOT EXISTS product_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_code VARCHAR(50) UNIQUE NOT NULL,
  role_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. TABLE: product_accounts (MAIN TABLE)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES product_applications(id) ON DELETE SET NULL,
  line_id UUID REFERENCES product_lines(id) ON DELETE SET NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES product_departments(id) ON DELETE SET NULL,
  role_id UUID REFERENCES product_roles(id) ON DELETE SET NULL,
  remark TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_accounts_application_id ON product_accounts(application_id);
CREATE INDEX IF NOT EXISTS idx_product_accounts_line_id ON product_accounts(line_id);
CREATE INDEX IF NOT EXISTS idx_product_accounts_username ON product_accounts(username);
CREATE INDEX IF NOT EXISTS idx_product_accounts_department_id ON product_accounts(department_id);
CREATE INDEX IF NOT EXISTS idx_product_accounts_role_id ON product_accounts(role_id);
CREATE INDEX IF NOT EXISTS idx_product_accounts_status ON product_accounts(status);
CREATE INDEX IF NOT EXISTS idx_product_accounts_created_at ON product_accounts(created_at);

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE product_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_accounts ENABLE ROW LEVEL SECURITY;

-- For development: Allow all operations
CREATE POLICY "Enable all access for development" ON product_applications FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON product_lines FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON product_departments FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON product_roles FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON product_accounts FOR ALL USING (true);

-- =====================================================
-- 7. USEFUL QUERIES untuk testing
-- =====================================================

-- View all product accounts dengan relasi lengkap
-- SELECT 
--   a.id,
--   app.app_name as application,
--   l.line_code as line,
--   a.username,
--   d.department_name as department_team,
--   r.role_name as role,
--   a.remark,
--   a.status,
--   a.created_at
-- FROM product_accounts a
-- LEFT JOIN product_applications app ON a.application_id = app.id
-- LEFT JOIN product_lines l ON a.line_id = l.id
-- LEFT JOIN product_departments d ON a.department_id = d.id
-- LEFT JOIN product_roles r ON a.role_id = r.id
-- ORDER BY app.app_name, l.line_code, a.username;

-- Count product accounts by line
-- SELECT 
--   l.line_code,
--   COUNT(a.id) as account_count
-- FROM product_lines l
-- LEFT JOIN product_accounts a ON a.line_id = l.id
-- GROUP BY l.line_code
-- ORDER BY l.line_code;

-- Count product accounts by department
-- SELECT 
--   d.department_name,
--   COUNT(a.id) as account_count
-- FROM product_departments d
-- LEFT JOIN product_accounts a ON a.department_id = d.id
-- GROUP BY d.department_name
-- ORDER BY account_count DESC;

-- Count product accounts by role
-- SELECT 
--   r.role_name,
--   COUNT(a.id) as account_count
-- FROM product_roles r
-- LEFT JOIN product_accounts a ON a.role_id = r.id
-- GROUP BY r.role_name
-- ORDER BY account_count DESC;

-- Get total stats for dashboard
-- SELECT 
--   COUNT(*) as total_accounts,
--   COUNT(CASE WHEN status = 'active' THEN 1 END) as active_accounts,
--   COUNT(DISTINCT line_id) as total_lines,
--   COUNT(DISTINCT department_id) as total_departments,
--   COUNT(DISTINCT role_id) as total_roles
-- FROM product_accounts;
