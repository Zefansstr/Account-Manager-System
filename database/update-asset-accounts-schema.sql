-- =====================================================
-- Update asset_accounts Schema to Match Current Structure
-- =====================================================
-- Run this script di Supabase SQL Editor
-- Script ini akan:
-- 1. Menambahkan kolom brand (jika belum ada)
-- 2. Menghapus kolom specification (jika ada)
-- =====================================================

-- 1. Add brand column (if not exists)
ALTER TABLE asset_accounts
  ADD COLUMN IF NOT EXISTS brand VARCHAR(255);

-- Create index for brand (optional, for better search performance)
CREATE INDEX IF NOT EXISTS idx_asset_accounts_brand ON asset_accounts(brand);

-- 2. Remove specification column (if exists)
ALTER TABLE asset_accounts
  DROP COLUMN IF EXISTS specification;

-- =====================================================
-- Expected Columns in asset_accounts after this script:
-- =====================================================
-- id (uuid)
-- code (varchar)
-- type_id (uuid) - foreign key to asset_types
-- currency_id (uuid) - foreign key to asset_currencies (optional, for backward compatibility)
-- brand (varchar) - NEW: Brand as text input
-- item (varchar) - Device Name
-- user_use (varchar) - Current User
-- note (text) - Remarks
-- department_team (varchar) - Department
-- storage_location (varchar) - Location
-- purchase_amount (numeric) - Purchase
-- currency (varchar) - Currency for Purchase Amount
-- status (varchar) - Status
-- created_at (timestamp)
-- updated_at (timestamp)
-- created_by (uuid)
-- updated_by (uuid)
-- =====================================================

-- Verification Query (uncomment to check):
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'asset_accounts'
-- ORDER BY ordinal_position;
