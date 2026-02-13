-- =====================================================
-- Create Asset Brands Table for Asset Management
-- =====================================================
-- Run this script di Supabase SQL Editor
-- =====================================================

-- TABLE: asset_brands (Brand)
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_asset_brands_brand_code ON asset_brands(brand_code);
CREATE INDEX IF NOT EXISTS idx_asset_brands_brand_name ON asset_brands(brand_name);
CREATE INDEX IF NOT EXISTS idx_asset_brands_status ON asset_brands(status);

-- Enable Row Level Security
ALTER TABLE asset_brands ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (same format as asset_devices)
DROP POLICY IF EXISTS "Enable all access for development" ON asset_brands;
CREATE POLICY "Enable all access for development" ON asset_brands FOR ALL USING (true);

-- Add comments
COMMENT ON TABLE asset_brands IS 'Brand master data for Asset Management';
COMMENT ON COLUMN asset_brands.brand_code IS 'Unique code for the brand (e.g. APPLE_001)';
COMMENT ON COLUMN asset_brands.brand_name IS 'Name of the brand (e.g. Apple, Dell, HP)';
COMMENT ON COLUMN asset_brands.description IS 'Optional description of the brand';
COMMENT ON COLUMN asset_brands.status IS 'Status of the brand (active, inactive)';
