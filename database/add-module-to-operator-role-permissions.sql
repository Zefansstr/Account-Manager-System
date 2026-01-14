-- =====================================================
-- ADD MODULE COLUMN TO OPERATOR ROLE PERMISSIONS
-- =====================================================
-- This allows roles to have permissions per module:
-- - account-management
-- - product-management
-- - device-management
-- - operator-setting

-- Step 1: Add module column with default value
ALTER TABLE operator_role_permissions 
ADD COLUMN IF NOT EXISTS module VARCHAR(50) DEFAULT 'account-management';

-- Step 2: Set all existing permissions to account-management module
UPDATE operator_role_permissions 
SET module = 'account-management' 
WHERE module IS NULL OR module = 'account-management';

-- Step 3: Add NOT NULL constraint after setting default values
ALTER TABLE operator_role_permissions 
ALTER COLUMN module SET NOT NULL;

-- Step 4: Add comment to explain the column
COMMENT ON COLUMN operator_role_permissions.module IS 'Module name: account-management, product-management, device-management, operator-setting';

-- Step 5: Drop old unique constraint
ALTER TABLE operator_role_permissions 
DROP CONSTRAINT IF EXISTS operator_role_permissions_role_id_menu_name_key;

-- Step 6: Add new unique constraint with module
ALTER TABLE operator_role_permissions 
ADD CONSTRAINT operator_role_permissions_role_id_module_menu_name_key 
UNIQUE(role_id, module, menu_name);

-- Step 7: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_operator_role_permissions_module 
ON operator_role_permissions(module);

CREATE INDEX IF NOT EXISTS idx_operator_role_permissions_role_module 
ON operator_role_permissions(role_id, module);

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'operator_role_permissions'
    AND column_name = 'module'
ORDER BY column_name;

-- Show sample of the table structure
SELECT 
    id, 
    role_id, 
    module,
    menu_name, 
    can_view
FROM operator_role_permissions 
LIMIT 10;
