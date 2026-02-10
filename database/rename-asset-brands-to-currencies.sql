-- =====================================================
-- Rename Asset Brands to Asset Currencies
-- =====================================================
-- Run this script di Supabase SQL Editor
-- Script ini akan mengubah tabel asset_brands menjadi asset_currencies
-- =====================================================

-- Step 1: Rename table
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'asset_brands') THEN
    ALTER TABLE asset_brands RENAME TO asset_currencies;
    RAISE NOTICE 'Table asset_brands renamed to asset_currencies';
  ELSE
    RAISE NOTICE 'Table asset_brands does not exist, skipping rename';
  END IF;
END $$;

-- Step 2: Rename columns in asset_currencies
DO $$
BEGIN
  -- Rename brand_code to currency_code
  IF EXISTS (SELECT FROM information_schema.columns 
             WHERE table_name = 'asset_currencies' AND column_name = 'brand_code') THEN
    ALTER TABLE asset_currencies RENAME COLUMN brand_code TO currency_code;
    RAISE NOTICE 'Column brand_code renamed to currency_code';
  END IF;
  
  -- Rename brand_name to currency_name
  IF EXISTS (SELECT FROM information_schema.columns 
             WHERE table_name = 'asset_currencies' AND column_name = 'brand_name') THEN
    ALTER TABLE asset_currencies RENAME COLUMN brand_name TO currency_name;
    RAISE NOTICE 'Column brand_name renamed to currency_name';
  END IF;
END $$;

-- Step 3: Rename foreign key constraint in asset_accounts
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_constraint 
             WHERE conname = 'asset_accounts_brand_id_fkey') THEN
    ALTER TABLE asset_accounts RENAME CONSTRAINT asset_accounts_brand_id_fkey TO asset_accounts_currency_id_fkey;
    RAISE NOTICE 'Foreign key constraint renamed';
  END IF;
END $$;

-- Step 4: Rename column brand_id to currency_id in asset_accounts
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns 
             WHERE table_name = 'asset_accounts' AND column_name = 'brand_id') THEN
    ALTER TABLE asset_accounts RENAME COLUMN brand_id TO currency_id;
    RAISE NOTICE 'Column brand_id renamed to currency_id in asset_accounts';
  END IF;
END $$;

-- Step 5: Update foreign key reference
DO $$
BEGIN
  -- Drop old foreign key if exists
  IF EXISTS (SELECT FROM pg_constraint 
             WHERE conname = 'asset_accounts_currency_id_fkey') THEN
    ALTER TABLE asset_accounts DROP CONSTRAINT asset_accounts_currency_id_fkey;
  END IF;
  
  -- Add new foreign key with correct reference
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'asset_currencies') THEN
    ALTER TABLE asset_accounts 
    ADD CONSTRAINT asset_accounts_currency_id_fkey 
    FOREIGN KEY (currency_id) REFERENCES asset_currencies(id) ON DELETE SET NULL;
    RAISE NOTICE 'Foreign key constraint recreated';
  END IF;
END $$;

-- Step 6: Rename indexes
DO $$
BEGIN
  -- Rename index for asset_currencies.code
  IF EXISTS (SELECT FROM pg_indexes WHERE indexname = 'asset_brands_brand_code_key') THEN
    ALTER INDEX asset_brands_brand_code_key RENAME TO asset_currencies_currency_code_key;
    RAISE NOTICE 'Index asset_brands_brand_code_key renamed';
  END IF;
  
  -- Rename index for asset_accounts.brand_id
  IF EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_asset_accounts_brand_id') THEN
    ALTER INDEX idx_asset_accounts_brand_id RENAME TO idx_asset_accounts_currency_id;
    RAISE NOTICE 'Index idx_asset_accounts_brand_id renamed';
  END IF;
END $$;

-- Step 7: Update RLS policies
DO $$
BEGIN
  -- Drop old policy if exists
  IF EXISTS (SELECT FROM pg_policies 
             WHERE tablename = 'asset_brands' AND policyname = 'Enable all access for development') THEN
    DROP POLICY IF EXISTS "Enable all access for development" ON asset_brands;
  END IF;
  
  -- Create new policy for asset_currencies
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'asset_currencies') THEN
    DROP POLICY IF EXISTS "Enable all access for development" ON asset_currencies;
    CREATE POLICY "Enable all access for development" ON asset_currencies FOR ALL USING (true);
    RAISE NOTICE 'RLS policy updated for asset_currencies';
  END IF;
END $$;

-- =====================================================
-- Verification Queries
-- =====================================================
-- Uncomment to verify changes:
-- 
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name LIKE 'asset_%';
-- 
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'asset_currencies' ORDER BY ordinal_position;
-- 
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'asset_accounts' AND column_name LIKE '%currency%';
-- =====================================================
