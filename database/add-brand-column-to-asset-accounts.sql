-- =====================================================
-- Add Brand Column to asset_accounts
-- =====================================================
-- Run this script di Supabase SQL Editor
-- Script ini akan menambahkan kolom brand sebagai VARCHAR
-- =====================================================

-- Add brand column (if not exists)
ALTER TABLE asset_accounts
  ADD COLUMN IF NOT EXISTS brand VARCHAR(255);

-- Create index for brand (optional, for better search performance)
CREATE INDEX IF NOT EXISTS idx_asset_accounts_brand ON asset_accounts(brand);

-- =====================================================
-- Note: currency_id column can remain for backward compatibility
-- but brand will be used as the primary field for brand data
-- =====================================================
