# Chat System V2 - Complete Guide

## 📋 Overview

Sistem chat telah di-upgrade menjadi versi 2 dengan fitur-fitur advanced:

### **3 Jenis Chat:**
1. **Support Chat** - Operator membuat ticket support, hanya Admin/Super Admin yang bisa reply
2. **Personal Chat** - Chat 1-on-1 antara:
   - Super Admin ↔ Any Operator
   - Regular Operator ↔ Super Admin only
3. **Group Chat** - Multi-participant chat (hanya Super Admin yang bisa create)

---

## 🎯 Fitur Utama

### ✅ Permission-Based Access
- **Regular Operators:**
  - Bisa create Support Chat
  - Bisa send messages di Support Chat yang mereka buat
  - Bisa initiate Personal Chat dengan Super Admin
  - Bisa participate di Group Chat jika di-invite
  - **TIDAK BISA** chat dengan operator lain selain Super Admin
  - **TIDAK BISA** create Group Chat

- **Admin:**
  - Bisa reply semua Support Chat
  - Bisa send messages di Personal/Group Chat yang mereka ikuti
  - Bisa see all Support Chats (tapi hanya Personal/Group Chat yang mereka ikuti)
  - **TIDAK BISA** delete chats
  - **TIDAK BISA** create Group Chat

- **Super Admin:**
  - **FULL ACCESS** - bisa melakukan semua operasi
  - Bisa initiate Personal Chat dengan operator manapun
  - Bisa create Group Chat dengan participants manapun
  - Bisa delete ANY chat (Support/Personal/Group)
  - Bisa see all chats

### ✅ Real-time Features
- Instant message updates menggunakan Supabase Realtime
- Unread count di Sidebar dan Topbar
- Read receipts (single check vs double check)
- Live message synchronization

### ✅ File Attachments
- Upload files ke Supabase Storage
- Download attachments dari messages
- Support multiple file types

### ✅ UI/UX Improvements
- Tab-based interface (Support / Personal / Groups)
- Room type icons dan badges
- Status indicators (online/offline for personal chats)
- Participant count untuk group chats
- Delete confirmation dialogs

---

## 🔧 Database Schema (V2)

### Updated Tables

#### `chat_rooms`
```sql
- room_type: 'support' | 'personal' | 'group'
- group_name: VARCHAR(255) -- untuk group chats
- group_admin: UUID -- Super Admin yang create group
- is_deleted: BOOLEAN -- soft delete
- deleted_at: TIMESTAMP
- deleted_by: UUID
```

#### `chat_participants`
```sql
- role: 'member' | 'admin' | 'super_admin'
- can_send_messages: BOOLEAN
- added_by: UUID
- left_at: TIMESTAMP -- untuk tracking who left
```

### New Functions

1. **`can_operator_send_message()`** - Check apakah operator bisa send message
2. **`can_create_personal_chat()`** - Validate personal chat creation
3. **`get_or_create_personal_chat()`** - Get existing atau create new personal chat
4. **`soft_delete_chat_room()`** - Soft delete dengan audit trail
5. **`get_unread_count()`** - Updated untuk support semua room types

---

## 🔌 API Endpoints

### Support Chat (existing, enhanced)
- `GET /api/chat/rooms` - List all rooms (filtered by role)
- `POST /api/chat/rooms` - Create new support chat
- `DELETE /api/chat/rooms?room_id=X&operator_id=Y` - Delete chat (Super Admin only)
- `GET /api/chat/rooms/[id]` - Get messages for room
- `PATCH /api/chat/rooms/[id]` - Update room status

### Personal Chat (NEW)
- `GET /api/chat/personal` - List all personal chats for current operator
- `POST /api/chat/personal` - Create or get personal chat
  ```json
  {
    "initiator_id": "uuid",
    "target_operator_id": "uuid"
  }
  ```

### Group Chat (NEW)
- `GET /api/chat/groups` - List all groups (filtered by role)
- `POST /api/chat/groups` - Create new group (Super Admin only)
  ```json
  {
    "group_name": "Team Discussion",
    "description": "Optional description",
    "created_by": "uuid",
    "participant_ids": ["uuid1", "uuid2", ...]
  }
  ```
- `GET /api/chat/groups/[id]` - Get group details with participants
- `PATCH /api/chat/groups/[id]` - Update group (Super Admin only)
- `DELETE /api/chat/groups/[id]` - Delete group (Super Admin only)
- `POST /api/chat/groups/[id]/participants` - Add participant (Super Admin only)
- `DELETE /api/chat/groups/[id]/participants` - Remove participant (Super Admin only)

### Messages (enhanced)
- `POST /api/chat/messages` - Send message (dengan permission check)
  - Automatically checks room type dan sender permissions
  - Returns 403 jika tidak ada permission

### Operators List (NEW)
- `GET /api/operators/list` - List all active operators
  - Filtered berdasarkan role (Regular operators hanya see Super Admins)
  - Used untuk create personal chats dan group chats

---

## 🚀 Setup Instructions

### 1. Database Setup
```bash
# Step 1: Update schema (add new columns dan functions)
# Run di Supabase SQL Editor:
database/update-chat-system-v2.sql

# Step 2: Verify tables created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'chat%';

# Expected output:
# - chat_rooms
# - chat_messages
# - chat_attachments
# - chat_participants

# Step 3: Test new functions
SELECT * FROM get_or_create_personal_chat('operator1_id', 'operator2_id', 'operator1_id');
```

### 2. Restart Services
```bash
# Kill all Node.js processes
taskkill /F /IM node.exe

# Delete Next.js build cache (important!)
rmdir /s /q .next

# Restart dev server
npm run dev
```

### 3. Test Supabase Realtime
```bash
# Pastikan Supabase Realtime enabled untuk chat tables
# Check di Supabase Dashboard > Database > Replication
```

---

## 🧪 Testing Scenarios

### Scenario 1: Support Chat (Regular Operator)
1. Login sebagai regular operator
2. Go to Support Chat page
3. Click "New Support Chat"
4. Create ticket dengan subject "Test Issue"
5. Send message di chat tersebut
6. **Expected:** Message terkirim successfully
7. **Expected:** Admin/Super Admin bisa see dan reply

### Scenario 2: Personal Chat (Regular Operator)
1. Login sebagai regular operator
2. Go to Support Chat > Personal tab
3. Click "New Personal Chat"
4. **Expected:** Hanya Super Admins yang muncul di dropdown
5. Select Super Admin dan click "Start Chat"
6. **Expected:** Personal chat created
7. Send message
8. **Expected:** Message terkirim successfully

### Scenario 3: Personal Chat (Super Admin)
1. Login sebagai Super Admin
2. Go to Support Chat > Personal tab
3. Click "New Personal Chat"
4. **Expected:** Semua operators muncul di dropdown (except self)
5. Select any operator dan start chat
6. Send message
7. **Expected:** Operator tersebut bisa see dan reply

### Scenario 4: Group Chat (Super Admin)
1. Login sebagai Super Admin
2. Go to Support Chat > Groups tab
3. Click "New Group Chat"
4. Enter group name "Test Group"
5. Select 2-3 participants
6. Click "Create Group"
7. **Expected:** Group created successfully
8. Send message
9. **Expected:** All participants bisa see messages
10. Login sebagai salah satu participant
11. **Expected:** Bisa see group dan send messages

### Scenario 5: Delete Chat (Super Admin)
1. Login sebagai Super Admin
2. Select any chat (Support/Personal/Group)
3. Click "Delete" button di chat header
4. Confirm deletion
5. **Expected:** Chat deleted (soft delete)
6. **Expected:** Chat tidak muncul lagi di list
7. Login sebagai participant lain
8. **Expected:** Chat juga tidak terlihat untuk mereka

### Scenario 6: Permission Restrictions
1. Login sebagai regular operator
2. Try to send message di Support Chat yang bukan mereka buat
3. **Expected:** Error "You don't have permission to send messages"
4. Try to create Personal Chat dengan operator lain (non-Super Admin)
5. **Expected:** Tidak ada operator lain di dropdown (hanya Super Admins)

---

## 🐛 Troubleshooting

### Error: "Could not find table 'chat_rooms'"
**Solution:**
1. Run `database/update-chat-system-v2.sql` di Supabase SQL Editor
2. Wait 30 seconds untuk schema cache refresh
3. Restart Next.js dev server

### Error: "You don't have permission to send messages"
**Check:**
1. Room type - apakah sender adalah participant?
2. Operator role - apakah Admin/Super Admin untuk Support Chat?
3. Database - check `chat_participants` table

### Realtime Not Working
**Solution:**
1. Check Supabase Realtime status di Dashboard
2. Verify table replication enabled untuk `chat_messages`
3. Check browser console untuk WebSocket errors
4. Restart Supabase project jika perlu

### Unread Count Not Updating
**Solution:**
1. Check `chat_participants.last_read_at` is updated when sending message
2. Verify `get_unread_count()` function exists
3. Check `/api/chat/unread-count` endpoint returns correct data

---

## 📊 Performance Considerations

### Optimizations Implemented
1. **Indexes:**
   - `idx_chat_rooms_room_type` - Fast filtering by type
   - `idx_chat_rooms_is_deleted` - Fast filtering deleted rooms
   - `idx_chat_participants_role` - Fast role-based queries
   - `idx_chat_messages_is_read` - Fast unread count

2. **Query Optimization:**
   - Use `single()` instead of `maybeSingle()` when expecting one result
   - Limit selects to required fields only
   - Use `count: "exact"` dengan `head: true` untuk counting

3. **Caching Strategy:**
   - Room list di-cache di client state
   - Messages fetched on-demand
   - Unread count refreshed setiap 30 detik

### Future Improvements
- [ ] Add pagination untuk messages (load more)
- [ ] Add search functionality
- [ ] Add typing indicators
- [ ] Add message reactions (emoji)
- [ ] Add voice/video call integration
- [ ] Add message editing/deletion
- [ ] Add chat export functionality

---

## 🔐 Security Notes

### Permission Checks
- **API Level:** Setiap API route check operator role sebelum process
- **Database Level:** RLS policies (currently permissive untuk development)
- **UI Level:** Conditional rendering based on role

### Audit Trail
- Semua deletes adalah soft deletes dengan `deleted_by` dan `deleted_at`
- Message history preserved even after chat deletion
- Participant additions/removals tracked dengan `added_by` dan `left_at`

### Recommendations for Production
1. **Enable stricter RLS policies:**
   - Replace "Allow all for development" policies
   - Implement row-level security based on `chat_participants`

2. **Rate limiting:**
   - Add rate limiting untuk message sending
   - Prevent spam/abuse

3. **File upload restrictions:**
   - Validate file types dan size
   - Scan for malware
   - Set storage quotas per user

4. **Encryption:**
   - Consider end-to-end encryption untuk sensitive chats
   - Encrypt file attachments at rest

---

## 📝 Changelog

### Version 2.0 (Current)
- ✅ Added Personal Chat functionality
- ✅ Added Group Chat functionality
- ✅ Implemented role-based permissions
- ✅ Added soft delete feature
- ✅ Enhanced UI dengan tabs
- ✅ Improved error handling
- ✅ Added comprehensive permission checks

### Version 1.0 (Previous)
- ✅ Basic Support Chat
- ✅ Real-time messaging
- ✅ File attachments
- ✅ Unread notifications

---

## 👥 Credits

Built with:
- Next.js 15
- Supabase (Database + Realtime + Storage)
- TypeScript
- Tailwind CSS
- shadcn/ui components

---

## 📞 Support

Untuk issues atau feature requests, silakan hubungi development team.

**Happy Chatting! 🚀💬**

