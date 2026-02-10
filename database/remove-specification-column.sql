-- =====================================================
-- Remove Specification Column from asset_accounts
-- =====================================================
-- Run this script di Supabase SQL Editor
-- Script ini akan menghapus kolom specification dari tabel asset_accounts
-- =====================================================

-- Drop specification column (if exists)
ALTER TABLE asset_accounts
  DROP COLUMN IF EXISTS specification;

-- =====================================================
-- Note: Kolom specification sudah dihapus karena tidak digunakan
-- di tabel Assets Master sesuai dengan requirement
-- =====================================================
