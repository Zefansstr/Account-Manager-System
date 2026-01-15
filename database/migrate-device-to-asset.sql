-- =====================================================
-- Migration Script: Device Management to Asset Management
-- =====================================================
-- Run this script di Supabase SQL Editor
-- =====================================================
-- Script ini akan:
-- 1. Jika tabel device_* sudah ada: Rename ke asset_*
-- 2. Jika tabel device_* tidak ada: Buat tabel asset_* baru
-- =====================================================

-- Function to check if table exists and handle migration
DO $$
DECLARE
    device_types_exists BOOLEAN;
    device_brands_exists BOOLEAN;
    device_accounts_exists BOOLEAN;
BEGIN
    -- Check if device_* tables exist
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'device_types'
    ) INTO device_types_exists;
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'device_brands'
    ) INTO device_brands_exists;
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'device_accounts'
    ) INTO device_accounts_exists;

    -- If device_* tables exist, rename them
    IF device_types_exists THEN
        ALTER TABLE device_types RENAME TO asset_types;
        RAISE NOTICE 'Renamed device_types to asset_types';
    ELSE
        -- Create asset_types table
        CREATE TABLE IF NOT EXISTS asset_types (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            type_code VARCHAR(50) UNIQUE NOT NULL,
            type_name VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created asset_types table';
    END IF;

    IF device_brands_exists THEN
        ALTER TABLE device_brands RENAME TO asset_brands;
        RAISE NOTICE 'Renamed device_brands to asset_brands';
    ELSE
        -- Create asset_brands table
        CREATE TABLE IF NOT EXISTS asset_brands (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            brand_code VARCHAR(50) UNIQUE NOT NULL,
            brand_name VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created asset_brands table';
    END IF;

    IF device_accounts_exists THEN
        -- First, update foreign key references
        ALTER TABLE device_accounts 
            DROP CONSTRAINT IF EXISTS device_accounts_type_id_fkey,
            DROP CONSTRAINT IF EXISTS device_accounts_brand_id_fkey;
        
        -- Rename table
        ALTER TABLE device_accounts RENAME TO asset_accounts;
        
        -- Recreate foreign keys with new names
        ALTER TABLE asset_accounts 
            DROP CONSTRAINT IF EXISTS asset_accounts_type_id_fkey,
            ADD CONSTRAINT asset_accounts_type_id_fkey 
            FOREIGN KEY (type_id) REFERENCES asset_types(id) ON DELETE SET NULL;
        
        ALTER TABLE asset_accounts 
            DROP CONSTRAINT IF EXISTS asset_accounts_brand_id_fkey,
            ADD CONSTRAINT asset_accounts_brand_id_fkey 
            FOREIGN KEY (brand_id) REFERENCES asset_brands(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Renamed device_accounts to asset_accounts';
    ELSE
        -- Create asset_accounts table
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
        RAISE NOTICE 'Created asset_accounts table';
    END IF;
END $$;

-- Rename indexes if they exist
DO $$
BEGIN
    -- Rename indexes for asset_accounts
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_device_accounts_type_id') THEN
        ALTER INDEX idx_device_accounts_type_id RENAME TO idx_asset_accounts_type_id;
    ELSE
        CREATE INDEX IF NOT EXISTS idx_asset_accounts_type_id ON asset_accounts(type_id);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_device_accounts_brand_id') THEN
        ALTER INDEX idx_device_accounts_brand_id RENAME TO idx_asset_accounts_brand_id;
    ELSE
        CREATE INDEX IF NOT EXISTS idx_asset_accounts_brand_id ON asset_accounts(brand_id);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_device_accounts_code') THEN
        ALTER INDEX idx_device_accounts_code RENAME TO idx_asset_accounts_code;
    ELSE
        CREATE INDEX IF NOT EXISTS idx_asset_accounts_code ON asset_accounts(code);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_device_accounts_status') THEN
        ALTER INDEX idx_device_accounts_status RENAME TO idx_asset_accounts_status;
    ELSE
        CREATE INDEX IF NOT EXISTS idx_asset_accounts_status ON asset_accounts(status);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_device_accounts_created_at') THEN
        ALTER INDEX idx_device_accounts_created_at RENAME TO idx_asset_accounts_created_at;
    ELSE
        CREATE INDEX IF NOT EXISTS idx_asset_accounts_created_at ON asset_accounts(created_at);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_device_accounts_user_use') THEN
        ALTER INDEX idx_device_accounts_user_use RENAME TO idx_asset_accounts_user_use;
    ELSE
        CREATE INDEX IF NOT EXISTS idx_asset_accounts_user_use ON asset_accounts(user_use);
    END IF;
END $$;

-- Update RLS Policies (only drop if tables exist)
DO $$
BEGIN
    -- Only drop policies if the tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'device_types') THEN
        DROP POLICY IF EXISTS "Enable all access for development" ON device_types;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'device_brands') THEN
        DROP POLICY IF EXISTS "Enable all access for development" ON device_brands;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'device_accounts') THEN
        DROP POLICY IF EXISTS "Enable all access for development" ON device_accounts;
    END IF;
    
    -- Enable RLS on asset tables
    ALTER TABLE asset_types ENABLE ROW LEVEL SECURITY;
    ALTER TABLE asset_brands ENABLE ROW LEVEL SECURITY;
    ALTER TABLE asset_accounts ENABLE ROW LEVEL SECURITY;
    
    -- Create new policies (only if they don't exist)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'asset_types' 
        AND policyname = 'Enable all access for development'
    ) THEN
        CREATE POLICY "Enable all access for development" ON asset_types FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'asset_brands' 
        AND policyname = 'Enable all access for development'
    ) THEN
        CREATE POLICY "Enable all access for development" ON asset_brands FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'asset_accounts' 
        AND policyname = 'Enable all access for development'
    ) THEN
        CREATE POLICY "Enable all access for development" ON asset_accounts FOR ALL USING (true);
    END IF;
END $$;

-- Verify tables exist
SELECT 
    'asset_types' as table_name,
    COUNT(*) as row_count
FROM asset_types
UNION ALL
SELECT 
    'asset_brands' as table_name,
    COUNT(*) as row_count
FROM asset_brands
UNION ALL
SELECT 
    'asset_accounts' as table_name,
    COUNT(*) as row_count
FROM asset_accounts;
