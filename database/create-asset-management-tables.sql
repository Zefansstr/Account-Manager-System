-- =====================================================
-- Create Asset Management Tables
-- =====================================================
-- Run this script di Supabase SQL Editor
-- =====================================================

-- 1. TABLE: asset_types (Type)
-- =====================================================
CREATE TABLE IF NOT EXISTS asset_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type_code VARCHAR(50) UNIQUE NOT NULL,
  type_name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLE: asset_brands (Brand)
-- =====================================================
CREATE TABLE IF NOT EXISTS asset_brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_code VARCHAR(50) UNIQUE NOT NULL,
  brand_name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLE: asset_accounts (MAIN TABLE)
-- =====================================================
CREATE TABLE IF NOT EXISTS asset_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(255) UNIQUE NOT NULL,
  type_id UUID REFERENCES asset_types(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES asset_brands(id) ON DELETE SET NULL,
  item VARCHAR(255) NOT NULL,
  specification TEXT,
  user_use VARCHAR(255),
  note TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_asset_accounts_type_id ON asset_accounts(type_id);
CREATE INDEX IF NOT EXISTS idx_asset_accounts_brand_id ON asset_accounts(brand_id);
CREATE INDEX IF NOT EXISTS idx_asset_accounts_code ON asset_accounts(code);
CREATE INDEX IF NOT EXISTS idx_asset_accounts_status ON asset_accounts(status);
CREATE INDEX IF NOT EXISTS idx_asset_accounts_created_at ON asset_accounts(created_at);
CREATE INDEX IF NOT EXISTS idx_asset_accounts_user_use ON asset_accounts(user_use);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE asset_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_accounts ENABLE ROW LEVEL SECURITY;

-- For development: Allow all operations
DROP POLICY IF EXISTS "Enable all access for development" ON asset_types;
DROP POLICY IF EXISTS "Enable all access for development" ON asset_brands;
DROP POLICY IF EXISTS "Enable all access for development" ON asset_accounts;

CREATE POLICY "Enable all access for development" ON asset_types FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON asset_brands FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON asset_accounts FOR ALL USING (true);

-- =====================================================
-- Verification Query
-- =====================================================
-- Uncomment to verify tables were created:
-- SELECT 
--   'asset_types' as table_name,
--   COUNT(*) as row_count
-- FROM asset_types
-- UNION ALL
-- SELECT 
--   'asset_brands' as table_name,
--   COUNT(*) as row_count
-- FROM asset_brands
-- UNION ALL
-- SELECT 
--   'asset_accounts' as table_name,
--   COUNT(*) as row_count
-- FROM asset_accounts;
