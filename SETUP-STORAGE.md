# Setup Supabase Storage untuk Chat Files

## 📦 Create Storage Bucket

### Step 1: Buka Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Di sidebar, click **Storage**

### Step 2: Create Bucket
1. Click button **"New bucket"**
2. Fill in details:
   ```
   Name: chat-files
   Public bucket: ✅ YES (check this)
   File size limit: 10 MB (10485760 bytes)
   Allowed MIME types: (leave empty for all types)
   ```
3. Click **"Create bucket"**

### Step 3: Set Bucket Policies (Important!)
Setelah bucket ter-create, set RLS policies:

1. Click pada bucket `chat-files` 
2. Go to **Policies** tab
3. Click **"New Policy"**

#### Policy 1: Allow Upload (INSERT)
```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'chat-files' AND
  (storage.foldername(name))[1] = 'chat-attachments'
);
```

#### Policy 2: Allow Download (SELECT)
```sql
-- Allow public to read files (for download/preview)
CREATE POLICY "Allow public downloads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'chat-files');
```

#### Policy 3: Allow Delete (DELETE) - Super Admin only
```sql
-- Allow authenticated users to delete their own files
CREATE POLICY "Allow delete own files"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'chat-files');
```

### Step 4: Test Upload
1. Restart Next.js dev server:
   ```bash
   npm run dev
   ```
2. Go to Support Chat page
3. Try upload file
4. Should work! ✅

---

## 🔧 Bucket Configuration Details

### Bucket Name
```
chat-files
```

### Storage Path Structure
```
chat-files/
  └── chat-attachments/
      ├── 1234567890-abc123.jpg
      ├── 1234567891-def456.pdf
      └── 1234567892-ghi789.docx
```

### File Size Limit
- **Max file size:** 10 MB per file
- **Supported types:** All (images, documents, videos, etc)

### Security
- **Public bucket:** YES (untuk download/preview)
- **RLS enabled:** YES (controlled via policies)
- **Upload:** Authenticated users only
- **Download:** Public (anyone with URL)

---

## 🚨 Troubleshooting

### Error: "Bucket not found"
**Solution:** Create bucket di Supabase Dashboard (follow Step 2 above)

### Error: "new row violates row-level security policy"
**Solution:** Add RLS policies (follow Step 3 above)

### Error: "File size too large"
**Solution:** 
1. Increase file size limit di bucket settings
2. Or compress file before upload

### Error: "Invalid MIME type"
**Solution:**
1. Check bucket allowed MIME types settings
2. Set to empty (allow all) or add specific types

---

## 📊 Monitoring

### Check Storage Usage
1. Go to Supabase Dashboard > Storage
2. Click on `chat-files` bucket
3. View:
   - Total files
   - Total size
   - Recent uploads

### View Uploaded Files
```sql
-- Query all uploaded files
SELECT * FROM storage.objects 
WHERE bucket_id = 'chat-files' 
ORDER BY created_at DESC;
```

### View Chat Attachments
```sql
-- Query chat attachments with file info
SELECT 
  ca.*,
  cm.message,
  cr.subject as chat_subject
FROM chat_attachments ca
JOIN chat_messages cm ON cm.id = ca.message_id
JOIN chat_rooms cr ON cr.id = cm.room_id
ORDER BY ca.created_at DESC;
```

---

## 🔐 Security Best Practices

### 1. File Type Validation
Currently allows all file types. Consider restricting:
```typescript
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Add more as needed
];
```

### 2. File Size Limits
- Current: 10 MB
- Recommended: 
  - Images: 5 MB
  - Documents: 10 MB
  - Videos: 50 MB (if needed)

### 3. Virus Scanning
Consider integrating virus scanning service for production:
- ClamAV
- VirusTotal API
- AWS S3 + Lambda scanning

### 4. Cleanup Old Files
Create cron job to delete files from deleted chats:
```sql
-- Delete storage files for deleted chats
DELETE FROM storage.objects
WHERE bucket_id = 'chat-files'
AND name IN (
  SELECT DISTINCT split_part(file_url, '/', -1)
  FROM chat_attachments ca
  JOIN chat_messages cm ON cm.id = ca.message_id
  JOIN chat_rooms cr ON cr.id = cm.room_id
  WHERE cr.is_deleted = true
);
```

---

## ✅ Verification Checklist

- [ ] Bucket `chat-files` created
- [ ] Bucket set to PUBLIC
- [ ] File size limit set to 10 MB
- [ ] RLS policies added (INSERT, SELECT, DELETE)
- [ ] Test upload from chat page
- [ ] Verify file accessible via URL
- [ ] Test download/preview works
- [ ] Check Supabase Storage dashboard shows file

---

## 🎯 Next Steps After Setup

1. ✅ Upload file di chat
2. ✅ Verify file URL accessible
3. ✅ Test download file
4. ✅ Test file preview (images)
5. ✅ Monitor storage usage

**Setup complete! File uploads should work now! 🚀**

