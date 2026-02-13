-- =====================================================
-- Create Asset Details Table for Asset Management
-- =====================================================
-- Run this script di Supabase SQL Editor
-- =====================================================

-- TABLE: asset_details
-- =====================================================
CREATE TABLE IF NOT EXISTS asset_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES asset_accounts(id) ON DELETE CASCADE,
  condition VARCHAR(50),
  year_of_purchase INTEGER,
  year_of_production INTEGER,
  cpu VARCHAR(255),
  gpu VARCHAR(255),
  ram VARCHAR(100),
  memory VARCHAR(100),
  item VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(asset_id) -- One detail per asset
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_asset_details_asset_id ON asset_details(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_details_condition ON asset_details(condition);
CREATE INDEX IF NOT EXISTS idx_asset_details_created_at ON asset_details(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE asset_details ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all operations for authenticated users
DROP POLICY IF EXISTS "Enable all access for development" ON asset_details;
CREATE POLICY "Enable all access for development" ON asset_details FOR ALL USING (true);

-- Add comments
COMMENT ON TABLE asset_details IS 'Detailed specifications for assets (primarily for Laptop/Computer)';
COMMENT ON COLUMN asset_details.asset_id IS 'Foreign key to asset_accounts';
COMMENT ON COLUMN asset_details.condition IS 'Condition of the asset (e.g., New, Good, Fair, Poor)';
COMMENT ON COLUMN asset_details.year_of_purchase IS 'Year when the asset was purchased';
COMMENT ON COLUMN asset_details.year_of_production IS 'Year when the asset was produced';
COMMENT ON COLUMN asset_details.cpu IS 'CPU specification';
COMMENT ON COLUMN asset_details.gpu IS 'GPU specification';
COMMENT ON COLUMN asset_details.ram IS 'RAM specification';
COMMENT ON COLUMN asset_details.memory IS 'Storage/Memory specification';
COMMENT ON COLUMN asset_details.item IS 'Item description';

-- =====================================================
-- Verification Query
-- =====================================================
-- Uncomment to verify table was created:
-- SELECT 
--   'asset_details' as table_name,
--   COUNT(*) as row_count
-- FROM asset_details;

-- =====================================================
-- Expected Columns:
-- =====================================================
-- id (uuid) - Primary Key
-- asset_id (uuid) - Foreign Key to asset_accounts (unique)
-- condition (varchar) - Condition
-- year_of_purchase (integer) - Year of purchase
-- year_of_production (integer) - Year of production
-- cpu (varchar) - CPU
-- gpu (varchar) - GPU
-- ram (varchar) - RAM
-- memory (varchar) - Memory
-- item (varchar) - Item
-- created_at (timestamp)
-- updated_at (timestamp)
-- created_by (uuid)
-- updated_by (uuid)
-- =====================================================
