-- =====================================================
-- Device Management - Database Indexes for Performance
-- =====================================================
-- Run this SQL in Supabase SQL Editor to optimize Device Management queries
-- =====================================================

-- DEVICE_ACCOUNTS TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_device_accounts_type_id ON device_accounts(type_id);
CREATE INDEX IF NOT EXISTS idx_device_accounts_brand_id ON device_accounts(brand_id);
CREATE INDEX IF NOT EXISTS idx_device_accounts_code ON device_accounts(code);
CREATE INDEX IF NOT EXISTS idx_device_accounts_status ON device_accounts(status);
CREATE INDEX IF NOT EXISTS idx_device_accounts_created_at ON device_accounts(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_device_accounts_status_type ON device_accounts(status, type_id);
CREATE INDEX IF NOT EXISTS idx_device_accounts_status_brand ON device_accounts(status, brand_id);

-- DEVICE_TYPES TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_device_types_type_code ON device_types(type_code);
CREATE INDEX IF NOT EXISTS idx_device_types_status ON device_types(status);
CREATE INDEX IF NOT EXISTS idx_device_types_created_at ON device_types(created_at DESC);

-- DEVICE_BRANDS TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_device_brands_brand_code ON device_brands(brand_code);
CREATE INDEX IF NOT EXISTS idx_device_brands_status ON device_brands(status);
CREATE INDEX IF NOT EXISTS idx_device_brands_created_at ON device_brands(created_at DESC);

-- =====================================================
-- ANALYZE TABLES (Update Statistics)
-- =====================================================
ANALYZE device_accounts;
ANALYZE device_types;
ANALYZE device_brands;
