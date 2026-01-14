-- =====================================================
-- ADD SUPPORT CHAT PERMISSION TO MENUS
-- =====================================================
-- This script adds "Support Chat" permission to operator role permissions
-- Run this script di Supabase SQL Editor AFTER running create-chat-system.sql
-- =====================================================

-- Note: Since we don't have a 'menus' table, permissions are managed directly
-- in operator_role_permissions table per role per menu

-- For each existing role, you need to manually add Support Chat permission
-- This is an example for Super Admin role

-- Example: Add Support Chat permission for Super Admin
-- First, get the Super Admin role ID:
-- SELECT id, role_name FROM operator_roles WHERE role_name = 'Super Admin';

-- Then insert permission (replace <super_admin_role_id> with actual ID):
/*
INSERT INTO operator_role_permissions (
  role_id,
  menu_name,
  can_view,
  can_create,
  can_edit,
  can_delete,
  can_enable_disable,
  can_import,
  can_export,
  visible_columns,
  allowed_applications,
  allowed_lines,
  allowed_departments
) VALUES (
  '<super_admin_role_id>',  -- Replace with actual role ID
  'Support Chat',
  true,  -- can_view
  true,  -- can_create (create new chat)
  false,  -- can_edit (not applicable)
  false,  -- can_delete (not applicable)
  false,  -- can_enable_disable (not applicable)
  false,  -- can_import
  false,  -- can_export
  '[]'::jsonb,  -- visible_columns
  '[]'::jsonb,  -- allowed_applications
  '[]'::jsonb,  -- allowed_lines
  '[]'::jsonb   -- allowed_departments
);
*/

-- =====================================================
-- AUTO-ADD SUPPORT CHAT FOR ALL EXISTING ROLES
-- =====================================================
-- This will add Support Chat permission to ALL roles with basic access

INSERT INTO operator_role_permissions (
  role_id,
  menu_name,
  can_view,
  can_create,
  can_edit,
  can_delete,
  can_enable_disable,
  can_import,
  can_export,
  visible_columns,
  allowed_applications,
  allowed_lines,
  allowed_departments
)
SELECT 
  id as role_id,
  'Support Chat' as menu_name,
  true as can_view,
  true as can_create,
  false as can_edit,
  false as can_delete,
  false as can_enable_disable,
  false as can_import,
  false as can_export,
  '[]'::jsonb as visible_columns,
  '[]'::jsonb as allowed_applications,
  '[]'::jsonb as allowed_lines,
  '[]'::jsonb as allowed_departments
FROM operator_roles
WHERE NOT EXISTS (
  SELECT 1 FROM operator_role_permissions 
  WHERE operator_role_permissions.role_id = operator_roles.id 
  AND operator_role_permissions.menu_name = 'Support Chat'
);

-- Verify permissions were added
SELECT 
  or_role.role_name,
  orp.menu_name,
  orp.can_view,
  orp.can_create
FROM operator_role_permissions orp
INNER JOIN operator_roles or_role ON orp.role_id = or_role.id
WHERE orp.menu_name = 'Support Chat'
ORDER BY or_role.role_name;

-- =====================================================
-- NOTE: Permission Behavior for Support Chat
-- =====================================================
-- can_view = true: Operator can see Support Chat menu and access the page
-- can_create = true: Operator can create new support chat rooms
-- 
-- Special Rules:
-- - Regular users can only see THEIR OWN chat rooms
-- - Super Admin and Admin roles can see ALL chat rooms
-- - Only Super Admin and Admin can REPLY to chats (handled in UI logic)
--
-- =====================================================
-- END OF SCRIPT
-- =====================================================

