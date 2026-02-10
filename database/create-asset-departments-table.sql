-- =====================================================
-- Create Asset Departments Table for Asset Management
-- =====================================================
-- Run this script di Supabase SQL Editor
-- =====================================================

-- TABLE: asset_departments
-- =====================================================
CREATE TABLE IF NOT EXISTS asset_departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department_code VARCHAR(50) UNIQUE NOT NULL,
  department_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_asset_departments_code ON asset_departments(department_code);
CREATE INDEX IF NOT EXISTS idx_asset_departments_name ON asset_departments(department_name);
CREATE INDEX IF NOT EXISTS idx_asset_departments_created_at ON asset_departments(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE asset_departments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all operations for authenticated users
DROP POLICY IF EXISTS "Enable all access for development" ON asset_departments;
CREATE POLICY "Enable all access for development" ON asset_departments FOR ALL USING (true);

-- =====================================================
-- Verification Query
-- =====================================================
-- Uncomment to verify table was created:
-- SELECT 
--   'asset_departments' as table_name,
--   COUNT(*) as row_count
-- FROM asset_departments;

-- =====================================================
-- Expected Columns:
-- =====================================================
-- id (uuid) - Primary Key
-- department_code (varchar) - Code (unique)
-- department_name (varchar) - Department Name
-- description (text) - Description
-- created_at (timestamp)
-- updated_at (timestamp)
-- =====================================================
