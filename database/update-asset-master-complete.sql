-- =====================================================
-- Complete Asset Master Schema Update
-- =====================================================
-- Run this script di Supabase SQL Editor
-- Script ini akan menambahkan semua field baru untuk Assets Master
-- =====================================================

-- Add new columns to asset_accounts table (if not exists)
ALTER TABLE asset_accounts
  ADD COLUMN IF NOT EXISTS department_team VARCHAR(255),
  ADD COLUMN IF NOT EXISTS storage_location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS purchase_amount NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10);

-- Create indexes for new fields (if not exists)
CREATE INDEX IF NOT EXISTS idx_asset_accounts_department_team ON asset_accounts(department_team);
CREATE INDEX IF NOT EXISTS idx_asset_accounts_storage_location ON asset_accounts(storage_location);
CREATE INDEX IF NOT EXISTS idx_asset_accounts_updated_at ON asset_accounts(updated_at);

-- Ensure user_use index exists (if not already created)
CREATE INDEX IF NOT EXISTS idx_asset_accounts_user_use ON asset_accounts(user_use);

-- =====================================================
-- Verification Query
-- =====================================================
-- Uncomment to verify all columns exist:
-- SELECT 
--   column_name, 
--   data_type, 
--   is_nullable,
--   column_default
-- FROM information_schema.columns
-- WHERE table_name = 'asset_accounts'
-- ORDER BY ordinal_position;

-- =====================================================
-- Expected Columns in asset_accounts:
-- =====================================================
-- id (uuid)
-- code (varchar)
-- type_id (uuid)
-- brand_id (uuid)
-- item (varchar) - Device Name
-- specification (text)
-- user_use (varchar) - Current User
-- note (text) - Remarks
-- department_team (varchar) - Department
-- storage_location (varchar) - Location
-- purchase_amount (numeric) - Purchase
-- currency (varchar) - Currency
-- status (varchar) - Status
-- created_at (timestamp)
-- updated_at (timestamp) - Last Updated
-- created_by (uuid)
-- updated_by (uuid)
-- =====================================================
