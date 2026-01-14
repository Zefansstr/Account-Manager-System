-- =====================================================
-- Device Management System - Database Schema
-- =====================================================
-- Run this script di Supabase SQL Editor
-- =====================================================

-- 1. TABLE: device_types (Type)
-- =====================================================
CREATE TABLE IF NOT EXISTS device_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type_code VARCHAR(50) UNIQUE NOT NULL,
  type_name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLE: device_brands (Brand)
-- =====================================================
CREATE TABLE IF NOT EXISTS device_brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_code VARCHAR(50) UNIQUE NOT NULL,
  brand_name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLE: device_accounts (MAIN TABLE)
-- =====================================================
CREATE TABLE IF NOT EXISTS device_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(255) UNIQUE NOT NULL,
  type_id UUID REFERENCES device_types(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES device_brands(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_device_accounts_type_id ON device_accounts(type_id);
CREATE INDEX IF NOT EXISTS idx_device_accounts_brand_id ON device_accounts(brand_id);
CREATE INDEX IF NOT EXISTS idx_device_accounts_code ON device_accounts(code);
CREATE INDEX IF NOT EXISTS idx_device_accounts_status ON device_accounts(status);
CREATE INDEX IF NOT EXISTS idx_device_accounts_created_at ON device_accounts(created_at);
CREATE INDEX IF NOT EXISTS idx_device_accounts_user_use ON device_accounts(user_use);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE device_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_accounts ENABLE ROW LEVEL SECURITY;

-- For development: Allow all operations
CREATE POLICY "Enable all access for development" ON device_types FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON device_brands FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON device_accounts FOR ALL USING (true);

-- =====================================================
-- 5. USEFUL QUERIES untuk testing
-- =====================================================

-- View all device accounts dengan relasi lengkap
-- SELECT 
--   d.id,
--   d.code,
--   dt.type_name as type,
--   db.brand_name as brand,
--   d.item,
--   d.specification,
--   d.user_use,
--   d.note,
--   d.status,
--   d.created_at
-- FROM device_accounts d
-- LEFT JOIN device_types dt ON d.type_id = dt.id
-- LEFT JOIN device_brands db ON d.brand_id = db.id
-- ORDER BY d.code;

-- Count device accounts by type
-- SELECT 
--   dt.type_name,
--   COUNT(d.id) as device_count
-- FROM device_types dt
-- LEFT JOIN device_accounts d ON d.type_id = dt.id
-- GROUP BY dt.type_name
-- ORDER BY dt.type_name;

-- Count device accounts by brand
-- SELECT 
--   db.brand_name,
--   COUNT(d.id) as device_count
-- FROM device_brands db
-- LEFT JOIN device_accounts d ON d.brand_id = db.id
-- GROUP BY db.brand_name
-- ORDER BY db.brand_name;

-- Get total stats for dashboard
-- SELECT 
--   COUNT(*) as total_devices,
--   COUNT(CASE WHEN status = 'active' THEN 1 END) as active_devices,
--   COUNT(DISTINCT type_id) as total_types,
--   COUNT(DISTINCT brand_id) as total_brands
-- FROM device_accounts;
