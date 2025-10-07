-- =====================================================
-- Account Management System - Database Schema (Simple Version)
-- =====================================================
-- Copy dan paste script ini ke Supabase SQL Editor
-- =====================================================

-- 1. TABLE: applications
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_code VARCHAR(50) UNIQUE NOT NULL,
  app_name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLE: lines  
CREATE TABLE IF NOT EXISTS lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  line_code VARCHAR(50) UNIQUE NOT NULL,
  line_name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLE: departments
CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department_code VARCHAR(50) UNIQUE NOT NULL,
  department_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLE: roles
CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_code VARCHAR(50) UNIQUE NOT NULL,
  role_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLE: accounts
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  line_id UUID REFERENCES lines(id) ON DELETE SET NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  remark TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- 6. TABLE: operator_roles (role templates untuk operators)
CREATE TABLE IF NOT EXISTS operator_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_code VARCHAR(50) UNIQUE NOT NULL,
  role_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false, -- untuk protect Super Admin role
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLE: operator_role_permissions (permissions template untuk each role)
CREATE TABLE IF NOT EXISTS operator_role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID REFERENCES operator_roles(id) ON DELETE CASCADE,
  menu_name VARCHAR(100) NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_enable_disable BOOLEAN DEFAULT false,
  can_import BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  visible_columns JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, menu_name)
);

-- 8. TABLE: operators (untuk login system)
CREATE TABLE IF NOT EXISTS operators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- hashed password
  full_name VARCHAR(255),
  email VARCHAR(255),
  operator_role_id UUID REFERENCES operator_roles(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active',
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- 9. TABLE: permissions (granular permission per operator - optional override)
CREATE TABLE IF NOT EXISTS permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id UUID REFERENCES operators(id) ON DELETE CASCADE,
  menu_name VARCHAR(100) NOT NULL, -- 'dashboard', 'accounts', 'applications', 'lines', 'departments', 'roles', 'operators', 'audit-logs'
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_enable_disable BOOLEAN DEFAULT false,
  can_import BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  visible_columns JSONB, -- array of column names yang boleh dilihat, e.g. ["application", "username", "line"]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(operator_id, menu_name)
);

-- 10. TABLE: activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_accounts_application_id ON accounts(application_id);
CREATE INDEX IF NOT EXISTS idx_accounts_line_id ON accounts(line_id);
CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username);
CREATE INDEX IF NOT EXISTS idx_accounts_department_id ON accounts(department_id);
CREATE INDEX IF NOT EXISTS idx_accounts_role_id ON accounts(role_id);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts(created_at);
CREATE INDEX IF NOT EXISTS idx_operator_roles_role_code ON operator_roles(role_code);
CREATE INDEX IF NOT EXISTS idx_operator_roles_status ON operator_roles(status);
CREATE INDEX IF NOT EXISTS idx_operator_role_permissions_role_id ON operator_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_operator_role_permissions_menu_name ON operator_role_permissions(menu_name);
CREATE INDEX IF NOT EXISTS idx_operators_username ON operators(username);
CREATE INDEX IF NOT EXISTS idx_operators_status ON operators(status);
CREATE INDEX IF NOT EXISTS idx_operators_role_id ON operators(operator_role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_operator_id ON permissions(operator_id);
CREATE INDEX IF NOT EXISTS idx_permissions_menu_name ON permissions(menu_name);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_table_name ON activity_logs(table_name);

-- Enable RLS (Row Level Security)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Development policies (Allow all access)
-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable all for dev" ON accounts;
DROP POLICY IF EXISTS "Enable all for dev" ON applications;
DROP POLICY IF EXISTS "Enable all for dev" ON lines;
DROP POLICY IF EXISTS "Enable all for dev" ON departments;
DROP POLICY IF EXISTS "Enable all for dev" ON roles;
DROP POLICY IF EXISTS "Enable all for dev" ON operator_roles;
DROP POLICY IF EXISTS "Enable all for dev" ON operator_role_permissions;
DROP POLICY IF EXISTS "Enable all for dev" ON operators;
DROP POLICY IF EXISTS "Enable all for dev" ON permissions;
DROP POLICY IF EXISTS "Enable all for dev" ON activity_logs;

-- Create new policies
CREATE POLICY "Enable all for dev" ON accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for dev" ON applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for dev" ON lines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for dev" ON departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for dev" ON roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for dev" ON operator_roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for dev" ON operator_role_permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for dev" ON operators FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for dev" ON permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for dev" ON activity_logs FOR ALL USING (true) WITH CHECK (true);

-- Insert sample data
INSERT INTO applications (app_code, app_name) VALUES
  ('HWBO', 'HWBO'),
  ('SCRM', 'SCRM'),
  ('OFFICE_GRAM', 'Office Gram')
ON CONFLICT (app_code) DO NOTHING;

INSERT INTO lines (line_code, line_name) VALUES
  ('SBMY', 'SBMY Line'),
  ('LVMY', 'LVMY Line'),
  ('MYR', 'MYR Line'),
  ('SGD', 'SGD Line')
ON CONFLICT (line_code) DO NOTHING;

INSERT INTO departments (department_code, department_name) VALUES
  ('CRM_HOD', 'CRM HOD'),
  ('SE2', 'SE2'),
  ('GCS_CSS', 'GCS/CSS'),
  ('SNR', 'SNR'),
  ('TE', 'TE'),
  ('PPC', 'PPC'),
  ('XBPO_SE2', 'XBPO SE2'),
  ('XBPO_CASHIER', 'XBPO Cashier')
ON CONFLICT (department_code) DO NOTHING;

INSERT INTO roles (role_code, role_name) VALUES
  ('HOD_M1', 'HOD - M1 Above'),
  ('SQUAD_LEAD', 'Squad Lead'),
  ('SQUAD_TEAM', 'Squad Team'),
  ('PPC_TEAM', 'PPC Team'),
  ('XBPO_TEAM', 'XBPO Team'),
  ('XBPO_CASHIER', 'XBPO Cashier')
ON CONFLICT (role_code) DO NOTHING;

-- Insert operator roles (role templates)
INSERT INTO operator_roles (role_code, role_name, description, is_system_role, status) VALUES
  ('SUPER_ADMIN', 'Super Admin', 'Full access to all features and settings', true, 'active'),
  ('ADMIN', 'Admin', 'Can manage accounts and basic settings', false, 'active'),
  ('EDITOR', 'Editor', 'Can create and edit accounts but cannot delete', false, 'active'),
  ('VIEWER', 'Viewer', 'Read-only access to view accounts', false, 'active')
ON CONFLICT (role_code) DO NOTHING;

-- Insert permissions for Super Admin role
INSERT INTO operator_role_permissions (role_id, menu_name, can_view, can_create, can_edit, can_delete, can_enable_disable, can_import, can_export, visible_columns)
SELECT 
  r.id,
  menu_name,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  visible_columns
FROM operator_roles r
CROSS JOIN (
  VALUES 
    ('dashboard', '[]'::jsonb),
    ('accounts', '["application", "line", "username", "password", "department", "role", "remark", "status"]'::jsonb),
    ('applications', '["app_code", "app_name", "description", "status"]'::jsonb),
    ('lines', '["line_code", "line_name", "description", "status"]'::jsonb),
    ('departments', '["department_code", "department_name", "description"]'::jsonb),
    ('roles', '["role_code", "role_name", "description"]'::jsonb),
    ('operators', '["username", "full_name", "email", "role_name", "status"]'::jsonb),
    ('audit-logs', '["user_id", "action", "table_name", "created_at"]'::jsonb)
) AS menus(menu_name, visible_columns)
WHERE r.role_code = 'SUPER_ADMIN'
ON CONFLICT (role_id, menu_name) DO NOTHING;

-- Insert permissions for Admin role
INSERT INTO operator_role_permissions (role_id, menu_name, can_view, can_create, can_edit, can_delete, can_enable_disable, can_import, can_export, visible_columns)
SELECT 
  r.id,
  menu_name,
  can_view,
  can_create,
  can_edit,
  can_delete,
  can_enable_disable,
  can_import,
  can_export,
  visible_columns
FROM operator_roles r
CROSS JOIN (
  VALUES 
    ('dashboard', true, false, false, false, false, false, false, '[]'::jsonb),
    ('accounts', true, true, true, true, true, true, true, '["application", "line", "username", "password", "department", "role", "remark", "status"]'::jsonb),
    ('applications', true, true, true, false, false, false, false, '["app_code", "app_name", "description", "status"]'::jsonb),
    ('lines', true, true, true, false, false, false, false, '["line_code", "line_name", "description", "status"]'::jsonb),
    ('departments', true, true, true, false, false, false, false, '["department_code", "department_name", "description"]'::jsonb),
    ('roles', true, false, false, false, false, false, false, '["role_code", "role_name", "description"]'::jsonb),
    ('operators', false, false, false, false, false, false, false, '[]'::jsonb),
    ('audit-logs', true, false, false, false, false, false, false, '["user_id", "action", "table_name", "created_at"]'::jsonb)
) AS menus(menu_name, can_view, can_create, can_edit, can_delete, can_enable_disable, can_import, can_export, visible_columns)
WHERE r.role_code = 'ADMIN'
ON CONFLICT (role_id, menu_name) DO NOTHING;

-- Insert permissions for Viewer role
INSERT INTO operator_role_permissions (role_id, menu_name, can_view, can_create, can_edit, can_delete, can_enable_disable, can_import, can_export, visible_columns)
SELECT 
  r.id,
  menu_name,
  true,
  false,
  false,
  false,
  false,
  false,
  false,
  visible_columns
FROM operator_roles r
CROSS JOIN (
  VALUES 
    ('dashboard', '[]'::jsonb),
    ('accounts', '["application", "line", "username", "department", "role", "status"]'::jsonb),
    ('applications', '["app_code", "app_name", "description", "status"]'::jsonb),
    ('lines', '["line_code", "line_name", "description", "status"]'::jsonb),
    ('departments', '["department_code", "department_name", "description"]'::jsonb),
    ('roles', '["role_code", "role_name", "description"]'::jsonb),
    ('operators', '[]'::jsonb),
    ('audit-logs', '[]'::jsonb)
) AS menus(menu_name, visible_columns)
WHERE r.role_code = 'VIEWER'
ON CONFLICT (role_id, menu_name) DO NOTHING;

-- Insert sample operator (Super Admin)
-- Password: 'admin123' (hashed with bcrypt)
INSERT INTO operators (username, password, full_name, email, operator_role_id, status) 
SELECT 
  'admin',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Super Admin',
  'admin@example.com',
  r.id,
  'active'
FROM operator_roles r
WHERE r.role_code = 'SUPER_ADMIN'
ON CONFLICT (username) DO NOTHING;
