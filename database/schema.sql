-- =====================================================
-- Account Management System - Simple Database Schema
-- =====================================================
-- Run this script di Supabase SQL Editor
-- =====================================================

-- 1. TABLE: applications
-- =====================================================
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_code VARCHAR(50) UNIQUE NOT NULL,
  app_name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default applications
INSERT INTO applications (app_code, app_name) VALUES
  ('HWBO', 'HWBO'),
  ('SCRM', 'SCRM'),
  ('OFFICE_GRAM', 'Office Gram');

-- =====================================================
-- 2. TABLE: lines
-- =====================================================
CREATE TABLE lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  line_code VARCHAR(50) UNIQUE NOT NULL,
  line_name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default lines
INSERT INTO lines (line_code, line_name) VALUES
  ('SBMY', 'SBMY Line'),
  ('LVMY', 'LVMY Line'),
  ('MYR', 'MYR Line'),
  ('SGD', 'SGD Line');

-- =====================================================
-- 3. TABLE: departments
-- =====================================================
CREATE TABLE departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department_code VARCHAR(50) UNIQUE NOT NULL,
  department_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert departments dari Excel
INSERT INTO departments (department_code, department_name) VALUES
  ('CRM_HOD', 'CRM HOD'),
  ('SE2', 'SE2'),
  ('GCS_CSS', 'GCS/CSS'),
  ('SNR', 'SNR'),
  ('TE', 'TE'),
  ('PPC', 'PPC'),
  ('XBPO_SE2', 'XBPO SE2'),
  ('XBPO_CASHIER', 'XBPO Cashier');

-- =====================================================
-- 4. TABLE: roles
-- =====================================================
CREATE TABLE roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_code VARCHAR(50) UNIQUE NOT NULL,
  role_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert roles dari Excel
INSERT INTO roles (role_code, role_name) VALUES
  ('HOD_M1', 'HOD - M1 Above'),
  ('SQUAD_LEAD', 'Squad Lead'),
  ('SQUAD_TEAM', 'Squad Team'),
  ('PPC_TEAM', 'PPC Team'),
  ('XBPO_TEAM', 'XBPO Team'),
  ('XBPO_CASHIER', 'XBPO Cashier');

-- =====================================================
-- 5. TABLE: accounts (MAIN TABLE)
-- =====================================================
CREATE TABLE accounts (
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

-- Create indexes for better performance
CREATE INDEX idx_accounts_application_id ON accounts(application_id);
CREATE INDEX idx_accounts_line_id ON accounts(line_id);
CREATE INDEX idx_accounts_username ON accounts(username);
CREATE INDEX idx_accounts_department_id ON accounts(department_id);
CREATE INDEX idx_accounts_role_id ON accounts(role_id);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_created_at ON accounts(created_at);

-- =====================================================
-- 6. TABLE: activity_logs (untuk audit trail)
-- =====================================================
CREATE TABLE activity_logs (
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

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_table_name ON activity_logs(table_name);

-- =====================================================
-- 7. INSERT SAMPLE DATA (dari Excel yang pertama)
-- =====================================================
-- Password: semua user default password "password123" (hashed dengan bcrypt)
-- Untuk production nanti bisa di-update

-- SBMY accounts (HWBO application)
INSERT INTO accounts (application_id, line_id, username, password, department_id, role_id, remark) VALUES
  (
    (SELECT id FROM applications WHERE app_code = 'HWBO'),
    (SELECT id FROM lines WHERE line_code = 'SBMY'),
    'SBMYHOD001',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'CRM_HOD'),
    (SELECT id FROM roles WHERE role_code = 'HOD_M1'),
    NULL
  ),
  (
    (SELECT id FROM applications WHERE app_code = 'HWBO'),
    (SELECT id FROM lines WHERE line_code = 'SBMY'),
    'SBMYLead001',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'SE2'),
    (SELECT id FROM roles WHERE role_code = 'SQUAD_LEAD'),
    NULL
  ),
  (
    (SELECT id FROM applications WHERE app_code = 'HWBO'),
    (SELECT id FROM lines WHERE line_code = 'SBMY'),
    'SBMYGCS001',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'GCS_CSS'),
    (SELECT id FROM roles WHERE role_code = 'SQUAD_TEAM'),
    NULL
  ),
  (
    (SELECT id FROM lines WHERE line_code = 'SBMY'),
    'SBMYGCS002',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'GCS_CSS'),
    (SELECT id FROM roles WHERE role_code = 'SQUAD_TEAM'),
    NULL
  ),
  (
    (SELECT id FROM lines WHERE line_code = 'SBMY'),
    'SBMYGCS003',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'GCS_CSS'),
    (SELECT id FROM roles WHERE role_code = 'SQUAD_TEAM'),
    NULL
  ),
  (
    (SELECT id FROM lines WHERE line_code = 'SBMY'),
    'SBMYGCS004',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'GCS_CSS'),
    (SELECT id FROM roles WHERE role_code = 'SQUAD_TEAM'),
    NULL
  ),
  (
    (SELECT id FROM lines WHERE line_code = 'SBMY'),
    'SBMYSNR001',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'SNR'),
    (SELECT id FROM roles WHERE role_code = 'SQUAD_TEAM'),
    NULL
  ),
  (
    (SELECT id FROM lines WHERE line_code = 'SBMY'),
    'SBMYSNR002',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'SNR'),
    (SELECT id FROM roles WHERE role_code = 'SQUAD_TEAM'),
    NULL
  ),
  (
    (SELECT id FROM lines WHERE line_code = 'SBMY'),
    'SBMYSNR003',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'SNR'),
    (SELECT id FROM roles WHERE role_code = 'SQUAD_TEAM'),
    NULL
  ),
  (
    (SELECT id FROM lines WHERE line_code = 'SBMY'),
    'SBMYSNR004',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'SNR'),
    (SELECT id FROM roles WHERE role_code = 'SQUAD_TEAM'),
    NULL
  ),
  (
    (SELECT id FROM lines WHERE line_code = 'SBMY'),
    'SBMYTE001',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'TE'),
    (SELECT id FROM roles WHERE role_code = 'PPC_TEAM'),
    NULL
  ),
  (
    (SELECT id FROM lines WHERE line_code = 'SBMY'),
    'SBMYPPC001',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'PPC'),
    (SELECT id FROM roles WHERE role_code = 'PPC_TEAM'),
    NULL
  ),
  (
    (SELECT id FROM lines WHERE line_code = 'SBMY'),
    'SBMYXBPO001',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'XBPO_SE2'),
    (SELECT id FROM roles WHERE role_code = 'XBPO_TEAM'),
    NULL
  ),
  (
    (SELECT id FROM lines WHERE line_code = 'SBMY'),
    'SBMYXBPO002',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'XBPO_SE2'),
    (SELECT id FROM roles WHERE role_code = 'XBPO_TEAM'),
    NULL
  ),
  (
    (SELECT id FROM lines WHERE line_code = 'SBMY'),
    'SBMYCASHIER01',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'XBPO_CASHIER'),
    (SELECT id FROM roles WHERE role_code = 'XBPO_CASHIER'),
    NULL
  ),
  (
    (SELECT id FROM lines WHERE line_code = 'SBMY'),
    'SBMYCASHIER02',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'XBPO_CASHIER'),
    (SELECT id FROM roles WHERE role_code = 'XBPO_CASHIER'),
    NULL
  ),
  (
    (SELECT id FROM lines WHERE line_code = 'SBMY'),
    'SBMYCASHIER03',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'XBPO_CASHIER'),
    (SELECT id FROM roles WHERE role_code = 'XBPO_CASHIER'),
    NULL
  ),
  (
    (SELECT id FROM lines WHERE line_code = 'SBMY'),
    'SBMYCASHIER04',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'XBPO_CASHIER'),
    (SELECT id FROM roles WHERE role_code = 'XBPO_CASHIER'),
    NULL
  );

-- LVMY accounts
INSERT INTO accounts (line_id, username, password, department_id, role_id, remark) VALUES
  (
    (SELECT id FROM lines WHERE line_code = 'LVMY'),
    'LVMYHOD001',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'CRM_HOD'),
    (SELECT id FROM roles WHERE role_code = 'HOD_M1'),
    NULL
  ),
  (
    (SELECT id FROM lines WHERE line_code = 'LVMY'),
    'LVMYLead001',
    '$2a$10$dummyhashpassword',
    (SELECT id FROM departments WHERE department_code = 'SE2'),
    (SELECT id FROM roles WHERE role_code = 'SQUAD_LEAD'),
    NULL
  );

-- =====================================================
-- 8. ENABLE ROW LEVEL SECURITY (Optional - untuk production)
-- =====================================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Untuk development: Allow all operations
CREATE POLICY "Enable all access for development" ON accounts FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON applications FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON lines FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON departments FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON roles FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON activity_logs FOR ALL USING (true);

-- =====================================================
-- 9. USEFUL QUERIES untuk testing
-- =====================================================

-- View all accounts dengan relasi lengkap
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
-- FROM accounts a
-- LEFT JOIN applications app ON a.application_id = app.id
-- LEFT JOIN lines l ON a.line_id = l.id
-- LEFT JOIN departments d ON a.department_id = d.id
-- LEFT JOIN roles r ON a.role_id = r.id
-- ORDER BY app.app_name, l.line_code, a.username;

-- Count accounts by line
-- SELECT 
--   l.line_code,
--   COUNT(a.id) as account_count
-- FROM lines l
-- LEFT JOIN accounts a ON a.line_id = l.id
-- GROUP BY l.line_code
-- ORDER BY l.line_code;

-- Count accounts by department
-- SELECT 
--   d.department_name,
--   COUNT(a.id) as account_count
-- FROM departments d
-- LEFT JOIN accounts a ON a.department_id = d.id
-- GROUP BY d.department_name
-- ORDER BY account_count DESC;

-- Count accounts by role
-- SELECT 
--   r.role_name,
--   COUNT(a.id) as account_count
-- FROM roles r
-- LEFT JOIN accounts a ON a.role_id = r.id
-- GROUP BY r.role_name
-- ORDER BY account_count DESC;

-- Get total stats for dashboard
-- SELECT 
--   COUNT(*) as total_accounts,
--   COUNT(CASE WHEN status = 'active' THEN 1 END) as active_accounts,
--   COUNT(DISTINCT line_id) as total_lines,
--   COUNT(DISTINCT department_id) as total_departments,
--   COUNT(DISTINCT role_id) as total_roles
-- FROM accounts;
