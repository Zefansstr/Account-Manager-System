-- =====================================================
-- SUPABASE STORAGE POLICIES FOR CHAT FILES
-- =====================================================
-- Run this AFTER creating 'chat-files' bucket in Supabase Dashboard
-- =====================================================

-- NOTE: Bucket must be created via Supabase Dashboard first!
-- Dashboard > Storage > New Bucket > Name: "chat-files" > Public: YES

-- =====================================================
-- 1. DROP OLD POLICIES (if any)
-- =====================================================
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete own files" ON storage.objects;

-- =====================================================
-- 2. POLICY: Allow Uploads
-- =====================================================
-- Allow all users to upload files to chat-attachments folder
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'chat-files' AND
  (storage.foldername(name))[1] = 'chat-attachments'
);

-- =====================================================
-- 3. POLICY: Allow Downloads (Public Read)
-- =====================================================
-- Allow anyone with URL to download/view files
CREATE POLICY "Allow public downloads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'chat-files');

-- =====================================================
-- 4. POLICY: Allow Deletes
-- =====================================================
-- Allow authenticated users to delete files
CREATE POLICY "Allow delete own files"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'chat-files');

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

-- Check if policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname LIKE '%chat%'
ORDER BY policyname;

-- Check bucket exists
SELECT * FROM storage.buckets WHERE id = 'chat-files';

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Now you can upload files in chat! 🚀

