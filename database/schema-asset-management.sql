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

-- 2. TABLE: asset_currencies (Currency)
-- =====================================================
CREATE TABLE IF NOT EXISTS asset_currencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  currency_code VARCHAR(50) UNIQUE NOT NULL,
  currency_name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLE: asset_accounts (MAIN TABLE - Assets Master)
-- =====================================================
CREATE TABLE IF NOT EXISTS asset_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(255) UNIQUE NOT NULL,
  type_id UUID REFERENCES asset_types(id) ON DELETE SET NULL,
  currency_id UUID REFERENCES asset_currencies(id) ON DELETE SET NULL,
  brand VARCHAR(255),
  item VARCHAR(255) NOT NULL,
  user_use VARCHAR(255),
  note TEXT,
  department_team VARCHAR(255),
  storage_location VARCHAR(255),
  purchase_amount NUMERIC(15, 2),
  currency VARCHAR(10),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_asset_accounts_type_id ON asset_accounts(type_id);
CREATE INDEX IF NOT EXISTS idx_asset_accounts_currency_id ON asset_accounts(currency_id);
CREATE INDEX IF NOT EXISTS idx_asset_accounts_status ON asset_accounts(status);
CREATE INDEX IF NOT EXISTS idx_asset_accounts_code ON asset_accounts(code);
CREATE INDEX IF NOT EXISTS idx_asset_accounts_user_use ON asset_accounts(user_use);
CREATE INDEX IF NOT EXISTS idx_asset_accounts_department_team ON asset_accounts(department_team);
CREATE INDEX IF NOT EXISTS idx_asset_accounts_storage_location ON asset_accounts(storage_location);
CREATE INDEX IF NOT EXISTS idx_asset_accounts_updated_at ON asset_accounts(updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE asset_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for asset_types
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON asset_types;
CREATE POLICY "Allow all operations for authenticated users" ON asset_types
  FOR ALL
  USING (auth.role() = 'authenticated');

-- RLS Policies for asset_currencies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON asset_currencies;
CREATE POLICY "Allow all operations for authenticated users" ON asset_currencies
  FOR ALL
  USING (auth.role() = 'authenticated');

-- RLS Policies for asset_accounts
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON asset_accounts;
CREATE POLICY "Allow all operations for authenticated users" ON asset_accounts
  FOR ALL
  USING (auth.role() = 'authenticated');

-- =====================================================
-- Migration Script: Rename from device_* to asset_*
-- =====================================================
-- If you have existing device_* tables, run this to migrate:
-- 
-- ALTER TABLE device_types RENAME TO asset_types;
-- ALTER TABLE device_brands RENAME TO asset_currencies;
-- ALTER TABLE device_accounts RENAME TO asset_accounts;
-- 
-- ALTER TABLE asset_accounts RENAME CONSTRAINT device_accounts_type_id_fkey TO asset_accounts_type_id_fkey;
-- ALTER TABLE asset_accounts RENAME CONSTRAINT device_accounts_brand_id_fkey TO asset_accounts_currency_id_fkey;
-- 
-- ALTER INDEX idx_device_accounts_type_id RENAME TO idx_asset_accounts_type_id;
-- ALTER INDEX idx_device_accounts_brand_id RENAME TO idx_asset_accounts_currency_id;
-- ALTER INDEX idx_device_accounts_status RENAME TO idx_asset_accounts_status;
-- ALTER INDEX idx_device_accounts_code RENAME TO idx_asset_accounts_code;
-- 
-- DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON device_types;
-- DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON device_currencies;
-- DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON device_accounts;
-- =====================================================
