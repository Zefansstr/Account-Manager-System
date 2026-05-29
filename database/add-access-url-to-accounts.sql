-- Add per-account login/access URL for Account Management
-- Run in Supabase SQL Editor

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS access_url TEXT;

COMMENT ON COLUMN accounts.access_url IS 'Login or portal URL for quick access from Account Management';
