-- =====================================================
-- ADD DATA-LEVEL FILTERS TO OPERATOR ROLE PERMISSIONS
-- =====================================================
-- This allows roles to restrict which data (rows) operators can see
-- based on Application, Line, Department, and Role filters

-- Add columns for data filtering
ALTER TABLE operator_role_permissions 
ADD COLUMN IF NOT EXISTS allowed_applications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS allowed_lines JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS allowed_departments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS allowed_roles JSONB DEFAULT '[]'::jsonb;

-- Add comments to explain the columns
COMMENT ON COLUMN operator_role_permissions.allowed_applications IS 'Array of application IDs that this role can see. Empty array = see all.';
COMMENT ON COLUMN operator_role_permissions.allowed_lines IS 'Array of line IDs that this role can see. Empty array = see all.';
COMMENT ON COLUMN operator_role_permissions.allowed_departments IS 'Array of department IDs that this role can see. Empty array = see all.';
COMMENT ON COLUMN operator_role_permissions.allowed_roles IS 'Array of role IDs that this role can see. Empty array = see all.';

-- Example: Update a role to only see SBMY line
-- First, get the line ID for SBMY
-- UPDATE operator_role_permissions 
-- SET allowed_lines = '["<line_id_for_sbmy>"]'::jsonb
-- WHERE role_id = '<role_id>' AND menu_name = 'Accounts';

-- Example: Update a role to only see CRM_HOD department
-- UPDATE operator_role_permissions 
-- SET allowed_departments = '["<dept_id_for_crm_hod>"]'::jsonb
-- WHERE role_id = '<role_id>' AND menu_name = 'Accounts';

-- Example: Role can see multiple lines
-- UPDATE operator_role_permissions 
-- SET allowed_lines = '["<line_id_1>", "<line_id_2>", "<line_id_3>"]'::jsonb
-- WHERE role_id = '<role_id>' AND menu_name = 'Accounts';

-- Note: Empty array '[]' or NULL means "see all data" (no filtering)

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_permissions_allowed_apps ON operator_role_permissions USING gin(allowed_applications);
CREATE INDEX IF NOT EXISTS idx_permissions_allowed_lines ON operator_role_permissions USING gin(allowed_lines);
CREATE INDEX IF NOT EXISTS idx_permissions_allowed_depts ON operator_role_permissions USING gin(allowed_departments);
CREATE INDEX IF NOT EXISTS idx_permissions_allowed_roles ON operator_role_permissions USING gin(allowed_roles);

-- Analyze table
ANALYZE operator_role_permissions;

-- Display success message
SELECT 'Data-level filters added to operator_role_permissions table successfully!' AS status;

-- Show current structure
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'operator_role_permissions'
ORDER BY ordinal_position;

