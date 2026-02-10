-- =====================================================
-- Create Assignment Log Table for Asset Management
-- =====================================================
-- Run this script di Supabase SQL Editor
-- =====================================================

-- TABLE: assignment_log
-- =====================================================
CREATE TABLE IF NOT EXISTS assignment_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  asset_id UUID REFERENCES asset_accounts(id) ON DELETE CASCADE,
  assigned_to VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  reason TEXT,
  handled_by VARCHAR(255),
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignment_log_date ON assignment_log(date);
CREATE INDEX IF NOT EXISTS idx_assignment_log_asset_id ON assignment_log(asset_id);
CREATE INDEX IF NOT EXISTS idx_assignment_log_assigned_to ON assignment_log(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignment_log_department ON assignment_log(department);
CREATE INDEX IF NOT EXISTS idx_assignment_log_created_at ON assignment_log(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE assignment_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all operations for authenticated users
DROP POLICY IF EXISTS "Enable all access for development" ON assignment_log;
CREATE POLICY "Enable all access for development" ON assignment_log FOR ALL USING (true);

-- =====================================================
-- Verification Query
-- =====================================================
-- Uncomment to verify table was created:
-- SELECT 
--   'assignment_log' as table_name,
--   COUNT(*) as row_count
-- FROM assignment_log;

-- =====================================================
-- Expected Columns:
-- =====================================================
-- id (uuid) - Primary Key
-- date (date) - Date
-- asset_id (uuid) - Foreign Key to asset_accounts
-- assigned_to (varchar) - Assigned To
-- department (varchar) - Department
-- reason (text) - Reason
-- handled_by (varchar) - Handled By
-- remark (text) - Remark
-- created_at (timestamp)
-- updated_at (timestamp)
-- created_by (uuid)
-- updated_by (uuid)
-- =====================================================
