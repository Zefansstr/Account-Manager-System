# 💬 Support Chat System - User Guide

## 🎯 Overview

Sistem **Support Chat Real-time** memungkinkan operator untuk berkomunikasi langsung dengan Super Admin dan Admin untuk mendapatkan bantuan, melaporkan masalah, atau meminta aktivasi akun.

### ✨ Fitur Utama:
- ✅ **Real-time Messaging** - Pesan langsung terkirim tanpa refresh
- ✅ **File Attachments** - Kirim screenshot, dokumen, dll
- ✅ **Unread Notifications** - Badge merah di sidebar dan topbar
- ✅ **Chat History** - Semua percakapan tersimpan
- ✅ **Status Tracking** - Open, In Progress, Resolved, Closed
- ✅ **Priority Levels** - Low, Normal, High, Urgent
- ✅ **Permission-based Access** - Hanya user dengan permission bisa akses

---

## 📋 Cara Menggunakan

### 1. **Membuat Chat Baru (Regular User)**

1. Klik menu **"Support Chat"** di sidebar
2. Klik tombol **"+ New"** di pojok kanan atas
3. Isi form:
   - **Subject**: Judul masalah (contoh: "Account Activation Request")
   - **Description**: Penjelasan detail masalah Anda
   - **Priority**: Pilih tingkat urgensi (Low/Normal/High/Urgent)
4. Klik **"Create Chat"**
5. Chat baru akan langsung muncul di list dan bisa langsung kirim pesan

### 2. **Mengirim Pesan**

1. Pilih chat room dari list di sebelah kiri
2. Ketik pesan di kotak input di bawah
3. Tekan **Enter** atau klik tombol **Send** (✈️)
4. Pesan akan langsung terkirim secara real-time

### 3. **Mengirim File Attachment**

1. Klik tombol **Paperclip** (📎) di sebelah input box
2. Pilih file dari komputer Anda (max 10MB)
3. File name akan muncul di atas input box
4. Ketik pesan tambahan (optional)
5. Klik **Send**
6. File akan ter-upload dan bisa di-download oleh penerima

### 4. **Membaca Pesan Baru**

- **Badge merah** di sidebar menunjukkan jumlah unread messages
- **Bell icon** 🔔 di topbar juga menampilkan unread count
- Klik notification atau menu Support Chat untuk membuka
- Pesan akan otomatis ditandai sebagai "read" saat chat dibuka

### 5. **Membalas Chat (Admin/Super Admin Only)**

- Super Admin dan Admin bisa melihat **SEMUA** support chats
- Mereka bisa langsung reply ke pesan user
- User akan mendapat notifikasi saat ada reply
- Admin bisa mengubah status chat (Open → In Progress → Resolved → Closed)

---

## 🎨 Status Chat

| Status | Arti | Warna |
|--------|------|-------|
| **Open** | Chat baru, menunggu response | 🟢 Hijau |
| **In Progress** | Admin sedang menangani | 🔵 Biru |
| **Resolved** | Masalah sudah selesai | ⚫ Abu-abu |
| **Closed** | Chat ditutup | 🔴 Merah |

## 📊 Priority Levels

| Priority | Kapan Digunakan | Warna |
|----------|----------------|-------|
| **Low** | Pertanyaan umum, tidak urgent | ⚫ Abu-abu |
| **Normal** | Request standar | 🔵 Biru |
| **High** | Butuh perhatian segera | 🟠 Orange |
| **Urgent** | Masalah kritis, butuh action ASAP | 🔴 Merah |

---

## 🔔 Notifications

### Di Sidebar:
- Badge merah dengan angka di menu **"Support Chat"**
- Update setiap 30 detik

### Di Topbar:
- Bell icon 🔔 dengan badge merah
- Klik untuk langsung ke halaman Support Chat

### Real-time Updates:
- Pesan baru langsung muncul tanpa refresh
- Menggunakan Supabase Realtime Subscription

---

## 🔐 Permission System

### Regular User:
- ✅ Bisa create chat baru
- ✅ Bisa kirim pesan dan file
- ✅ Hanya bisa lihat chat mereka sendiri
- ❌ Tidak bisa lihat chat user lain

### Admin:
- ✅ Bisa lihat SEMUA chat dari semua user
- ✅ Bisa reply ke semua chat
- ✅ Bisa ubah status chat
- ✅ Bisa assign chat ke diri sendiri

### Super Admin:
- ✅ Full access seperti Admin
- ✅ Bisa manage permissions untuk Support Chat

---

## 🛠️ Database Setup (For Admin)

### 1. Run Database Schema:
```sql
-- Run di Supabase SQL Editor
-- File: database/create-chat-system.sql
```

### 2. Add Permissions:
```sql
-- Run di Supabase SQL Editor
-- File: database/add-support-chat-permission.sql
```

### 3. Create Storage Bucket:
Supabase Storage akan otomatis create bucket `chat-files` saat first upload.
Jika ingin manual create:
```
1. Buka Supabase Dashboard
2. Storage → New Bucket
3. Name: "chat-files"
4. Public: false
5. File size limit: 10MB
```

---

## 🧪 Testing Guide

### Test 1: Create Chat (Regular User)
1. Login sebagai regular user
2. Buka Support Chat
3. Create new chat dengan subject "Test Chat"
4. Verify: Chat muncul di list

### Test 2: Send Message
1. Pilih chat room
2. Ketik "Test message" dan send
3. Verify: Message muncul di chat dengan timestamp
4. Verify: Message dari user muncul di kanan dengan background hijau

### Test 3: File Upload
1. Klik paperclip icon
2. Upload gambar (PNG/JPG)
3. Send message
4. Verify: File muncul dengan link download
5. Click link untuk verify file bisa di-download

### Test 4: Real-time Messaging
1. Buka 2 browser (atau 1 incognito)
2. Browser 1: Login sebagai user
3. Browser 2: Login sebagai admin
4. User kirim message
5. Verify: Admin langsung terima message tanpa refresh

### Test 5: Unread Count
1. Admin send message to user
2. User belum buka chat
3. Verify: Badge merah di sidebar dan topbar user
4. User buka chat
5. Verify: Badge hilang atau berkurang

### Test 6: Permissions
1. Login sebagai user tanpa permission "Support Chat"
2. Verify: Menu Support Chat tidak muncul di sidebar
3. Admin tambahkan permission
4. User refresh page
5. Verify: Menu Support Chat muncul

---

## 📁 File Structure

```
app/
├── api/
│   └── chat/
│       ├── rooms/
│       │   ├── route.ts              # GET rooms, POST create
│       │   └── [id]/
│       │       └── route.ts          # GET messages, PUT update status
│       ├── messages/
│       │   └── route.ts              # POST send message
│       ├── upload/
│       │   └── route.ts              # POST upload file
│       └── unread-count/
│           └── route.ts              # GET unread count
├── (dashboard)/
│   └── support-chat/
│       └── page.tsx                  # Chat UI page
components/
├── layout/
│   ├── sidebar.tsx                   # Updated with chat menu + badge
│   └── topbar.tsx                    # Updated with notification bell
database/
├── create-chat-system.sql            # Main database schema
└── add-support-chat-permission.sql   # Permission setup
```

---

## 🔧 Technical Details

### Real-time Implementation:
- Menggunakan **Supabase Realtime**
- Subscribe ke table `chat_messages`
- Filter berdasarkan `room_id`
- Auto-refresh saat ada INSERT/UPDATE

### File Upload:
- Menggunakan **Supabase Storage**
- Bucket: `chat-files`
- Max size: 10MB
- Private bucket (perlu authentication)
- File URL tersimpan di `chat_attachments` table

### Unread Tracking:
- Field `is_read` di `chat_messages`
- Field `last_read_at` di `chat_participants`
- Auto-mark as read saat user buka chat
- Efficient count query via API endpoint

---

## ⚠️ Troubleshooting

### Problem: Chat tidak muncul di sidebar
**Solution**: 
- Check permission di Operator Roles → Permissions
- Ensure "Support Chat" → can_view = true

### Problem: File upload gagal
**Solution**:
- Check Supabase Storage bucket `chat-files` exists
- Check file size < 10MB
- Check browser console untuk error

### Problem: Pesan tidak real-time
**Solution**:
- Check browser console untuk websocket errors
- Check Supabase Realtime enabled di project settings
- Try refresh page

### Problem: Unread count tidak update
**Solution**:
- Wait 30 seconds (auto-refresh interval)
- Atau refresh page manual
- Check API `/api/chat/unread-count` response

---

## 📞 Support

Jika ada masalah atau pertanyaan tentang Support Chat System:
1. Buat chat support melalui sistem ini 😊
2. Atau hubungi Super Admin langsung

---

**Last Updated**: 2025-01-XX  
**Version**: 1.0.0  
**Status**: Production Ready ✅

