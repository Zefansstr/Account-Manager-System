-- =====================================================
-- Create Maintenance Log Table for Asset Management
-- =====================================================
-- Run this script di Supabase SQL Editor
-- =====================================================

-- TABLE: maintenance_log
-- =====================================================
CREATE TABLE IF NOT EXISTS maintenance_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  asset_id UUID REFERENCES asset_accounts(id) ON DELETE CASCADE,
  issue_description TEXT NOT NULL,
  current_status VARCHAR(50) DEFAULT 'pending',
  maintenance_result TEXT,
  cost NUMERIC(15, 2),
  maintenance_unit VARCHAR(255),
  operator VARCHAR(255),
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_log_date ON maintenance_log(date);
CREATE INDEX IF NOT EXISTS idx_maintenance_log_asset_id ON maintenance_log(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_log_current_status ON maintenance_log(current_status);
CREATE INDEX IF NOT EXISTS idx_maintenance_log_operator ON maintenance_log(operator);
CREATE INDEX IF NOT EXISTS idx_maintenance_log_created_at ON maintenance_log(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE maintenance_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all operations for authenticated users
DROP POLICY IF EXISTS "Enable all access for development" ON maintenance_log;
CREATE POLICY "Enable all access for development" ON maintenance_log FOR ALL USING (true);

-- =====================================================
-- Verification Query
-- =====================================================
-- Uncomment to verify table was created:
-- SELECT 
--   'maintenance_log' as table_name,
--   COUNT(*) as row_count
-- FROM maintenance_log;

-- =====================================================
-- Expected Columns:
-- =====================================================
-- id (uuid) - Primary Key
-- date (date) - Date
-- asset_id (uuid) - Foreign Key to asset_accounts
-- issue_description (text) - Issue Description
-- current_status (varchar) - Current Status (pending, in_progress, completed, cancelled)
-- maintenance_result (text) - Maintenance Result
-- cost (numeric) - Cost (Optional)
-- maintenance_unit (varchar) - Maintenance Unit
-- operator (varchar) - Operator
-- remark (text) - Remark
-- created_at (timestamp)
-- updated_at (timestamp)
-- created_by (uuid)
-- updated_by (uuid)
-- =====================================================
