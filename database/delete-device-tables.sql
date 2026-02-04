-- =====================================================
-- Script untuk Delete Device Tables
-- =====================================================
-- Run this script di Supabase SQL Editor
-- =====================================================
-- PERINGATAN: Script ini akan menghapus semua tabel device_*
-- Pastikan data sudah di-backup atau sudah di-migrate ke asset_*
-- =====================================================

DO $$
BEGIN
    -- Drop policies first (if tables exist)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'device_types') THEN
        DROP POLICY IF EXISTS "Enable all access for development" ON device_types;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'device_brands') THEN
        DROP POLICY IF EXISTS "Enable all access for development" ON device_brands;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'device_accounts') THEN
        DROP POLICY IF EXISTS "Enable all access for development" ON device_accounts;
    END IF;
    
    -- Drop indexes if they exist
    DROP INDEX IF EXISTS idx_device_accounts_type_id;
    DROP INDEX IF EXISTS idx_device_accounts_brand_id;
    DROP INDEX IF EXISTS idx_device_accounts_code;
    DROP INDEX IF EXISTS idx_device_accounts_status;
    DROP INDEX IF EXISTS idx_device_accounts_created_at;
    DROP INDEX IF EXISTS idx_device_accounts_user_use;
    
    -- Drop tables (CASCADE will drop dependent objects)
    DROP TABLE IF EXISTS device_accounts CASCADE;
    DROP TABLE IF EXISTS device_types CASCADE;
    DROP TABLE IF EXISTS device_brands CASCADE;
    
    RAISE NOTICE 'Device tables deleted successfully';
END $$;

-- Verify deletion
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'device_types') 
        THEN 'device_types masih ada'
        ELSE 'device_types sudah dihapus'
    END as device_types_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'device_brands') 
        THEN 'device_brands masih ada'
        ELSE 'device_brands sudah dihapus'
    END as device_brands_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'device_accounts') 
        THEN 'device_accounts masih ada'
        ELSE 'device_accounts sudah dihapus'
    END as device_accounts_status;
