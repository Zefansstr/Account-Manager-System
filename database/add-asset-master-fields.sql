-- =====================================================
-- Add New Fields to Asset Accounts for Assets Master
-- =====================================================
-- Run this script di Supabase SQL Editor
-- =====================================================

-- Add new columns to asset_accounts table
ALTER TABLE asset_accounts
  ADD COLUMN IF NOT EXISTS department_team VARCHAR(255),
  ADD COLUMN IF NOT EXISTS storage_location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS purchase_amount NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10);

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_asset_accounts_department_team ON asset_accounts(department_team);
CREATE INDEX IF NOT EXISTS idx_asset_accounts_storage_location ON asset_accounts(storage_location);
CREATE INDEX IF NOT EXISTS idx_asset_accounts_updated_at ON asset_accounts(updated_at);

-- =====================================================
-- Verification Query
-- =====================================================
-- Uncomment to verify columns were added:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'asset_accounts'
-- ORDER BY ordinal_position;
