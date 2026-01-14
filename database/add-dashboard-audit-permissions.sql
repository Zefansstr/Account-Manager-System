-- =====================================================
-- Add Dashboard and Audit Logs Permission Columns
-- =====================================================
-- This script adds missing columns for Dashboard and Audit Logs
-- to the operator_role_permissions table

-- Add view_all_data column (Dashboard)
ALTER TABLE operator_role_permissions 
ADD COLUMN IF NOT EXISTS view_all_data BOOLEAN DEFAULT false;

-- Add view_segment_data column (Dashboard)
ALTER TABLE operator_role_permissions 
ADD COLUMN IF NOT EXISTS view_segment_data BOOLEAN DEFAULT false;

-- Add can_filter column (Audit Logs)
ALTER TABLE operator_role_permissions 
ADD COLUMN IF NOT EXISTS can_filter BOOLEAN DEFAULT false;

-- Add can_view_details column (Audit Logs)
ALTER TABLE operator_role_permissions 
ADD COLUMN IF NOT EXISTS can_view_details BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN operator_role_permissions.view_all_data IS 'Dashboard: Can view all data without filters';
COMMENT ON COLUMN operator_role_permissions.view_segment_data IS 'Dashboard: Can view segment data (filtered by allowed_applications, allowed_lines, etc.)';
COMMENT ON COLUMN operator_role_permissions.can_filter IS 'Audit Logs: Can use filter functionality';
COMMENT ON COLUMN operator_role_permissions.can_view_details IS 'Audit Logs: Can view detailed log information';

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'operator_role_permissions'
    AND column_name IN ('view_all_data', 'view_segment_data', 'can_filter', 'can_view_details')
ORDER BY column_name;

-- Show sample of the table structure
SELECT 
    id, 
    role_id, 
    menu_name, 
    can_view,
    view_all_data,
    view_segment_data,
    can_filter,
    can_view_details
FROM operator_role_permissions 
LIMIT 5;

