-- =====================================================
-- Asset Management System - Database Schema
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
CREATE INDEX IF NOT EXISTS idx_asset_accounts_status ON asset_accounts(status);
CREATE INDEX IF NOT EXISTS idx_asset_accounts_code ON asset_accounts(code);

-- Enable Row Level Security (RLS)
ALTER TABLE asset_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for asset_types
CREATE POLICY "Allow all operations for authenticated users" ON asset_types
  FOR ALL
  USING (auth.role() = 'authenticated');

-- RLS Policies for asset_brands
CREATE POLICY "Allow all operations for authenticated users" ON asset_brands
  FOR ALL
  USING (auth.role() = 'authenticated');

-- RLS Policies for asset_accounts
CREATE POLICY "Allow all operations for authenticated users" ON asset_accounts
  FOR ALL
  USING (auth.role() = 'authenticated');

-- =====================================================
-- Migration Script: Rename from device_* to asset_*
-- =====================================================
-- If you have existing device_* tables, run this to migrate:
-- 
-- ALTER TABLE device_types RENAME TO asset_types;
-- ALTER TABLE device_brands RENAME TO asset_brands;
-- ALTER TABLE device_accounts RENAME TO asset_accounts;
-- 
-- ALTER TABLE asset_accounts RENAME CONSTRAINT device_accounts_type_id_fkey TO asset_accounts_type_id_fkey;
-- ALTER TABLE asset_accounts RENAME CONSTRAINT device_accounts_brand_id_fkey TO asset_accounts_brand_id_fkey;
-- 
-- ALTER INDEX idx_device_accounts_type_id RENAME TO idx_asset_accounts_type_id;
-- ALTER INDEX idx_device_accounts_brand_id RENAME TO idx_asset_accounts_brand_id;
-- ALTER INDEX idx_device_accounts_status RENAME TO idx_asset_accounts_status;
-- ALTER INDEX idx_device_accounts_code RENAME TO idx_asset_accounts_code;
-- 
-- DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON device_types;
-- DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON device_brands;
-- DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON device_accounts;
-- =====================================================
