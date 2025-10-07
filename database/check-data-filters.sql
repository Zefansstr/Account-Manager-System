-- =====================================================
-- Check Data Filters for Operator Roles
-- =====================================================
-- This script helps you verify that data filters are saved correctly

-- 1. Check all permissions for a specific role
-- Replace 'ce20ee76-d958-45a5-95d2-da61062fa40c' with your actual role ID
SELECT 
    id,
    role_id,
    menu_name,
    can_view,
    view_all_data,
    view_segment_data,
    allowed_applications,
    allowed_lines,
    allowed_departments,
    allowed_roles
FROM operator_role_permissions
WHERE role_id = 'ce20ee76-d958-45a5-95d2-da61062fa40c'
ORDER BY menu_name;

-- 2. Check only "accounts" menu permission
SELECT 
    id,
    role_id,
    menu_name,
    allowed_applications,
    allowed_lines,
    allowed_departments,
    allowed_roles,
    jsonb_array_length(allowed_applications) as apps_count,
    jsonb_array_length(allowed_lines) as lines_count,
    jsonb_array_length(allowed_departments) as depts_count,
    jsonb_array_length(allowed_roles) as roles_count
FROM operator_role_permissions
WHERE role_id = 'ce20ee76-d958-45a5-95d2-da61062fa40c'
    AND menu_name = 'accounts';

-- 3. Show actual IDs and names for allowed departments
-- (Replace role_id with your actual role ID)
WITH role_filters AS (
    SELECT 
        allowed_departments
    FROM operator_role_permissions
    WHERE role_id = 'ce20ee76-d958-45a5-95d2-da61062fa40c'
        AND menu_name = 'accounts'
)
SELECT 
    d.id,
    d.department_code,
    d.department_name,
    CASE 
        WHEN (SELECT allowed_departments FROM role_filters) @> to_jsonb(d.id::text) THEN '✓ ALLOWED'
        ELSE '✗ NOT ALLOWED'
    END as status
FROM departments d
ORDER BY d.department_name;

-- 4. Show all departments with account counts
SELECT 
    d.id,
    d.department_code,
    d.department_name,
    COUNT(a.id) as total_accounts
FROM departments d
LEFT JOIN accounts a ON a.department_id = d.id
GROUP BY d.id, d.department_code, d.department_name
ORDER BY d.department_name;

