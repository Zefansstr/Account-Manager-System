-- =====================================================
-- Create Asset Devices Table
-- =====================================================
-- Run this script di Supabase SQL Editor
-- =====================================================

-- TABLE: asset_devices (Device)
-- =====================================================
CREATE TABLE IF NOT EXISTS asset_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_code VARCHAR(50) UNIQUE NOT NULL,
  device_name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_asset_devices_device_code ON asset_devices(device_code);
CREATE INDEX IF NOT EXISTS idx_asset_devices_device_name ON asset_devices(device_name);

-- Enable Row Level Security
ALTER TABLE asset_devices ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (same format as asset_departments)
DROP POLICY IF EXISTS "Enable all access for development" ON asset_devices;
CREATE POLICY "Enable all access for development" ON asset_devices FOR ALL USING (true);

-- Add comments
COMMENT ON TABLE asset_devices IS 'Device master data for Asset Management';
COMMENT ON COLUMN asset_devices.device_code IS 'Unique code for the device (e.g. LAPTOP_001)';
COMMENT ON COLUMN asset_devices.device_name IS 'Name of the device (e.g. Laptop)';
COMMENT ON COLUMN asset_devices.description IS 'Optional description of the device';
COMMENT ON COLUMN asset_devices.status IS 'Status of the device (active, inactive)';
