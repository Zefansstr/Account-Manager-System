# Setup Database Supabase - Account Management System

## 📋 Langkah-Langkah Setup

### 1. Buka Supabase Dashboard
- Login ke Supabase: https://supabase.com
- Pilih project Anda: `qsbbemeeykpqxakhwmal`

### 2. Run Database Schema
1. Di Supabase Dashboard, klik **SQL Editor** di sidebar kiri
2. Klik **New Query**
3. Copy semua isi dari file `database/schema-simple.sql`
4. Paste ke SQL Editor
5. Klik tombol **Run** (atau tekan Ctrl+Enter)

### 3. Verifikasi Tables
Setelah run schema, cek di **Table Editor**:
- ✅ `applications` - 3 rows (HWBO, SCRM, Office Gram)
- ✅ `lines` - 4 rows (SBMY, LVMY, MYR, SGD)
- ✅ `departments` - 8 rows (CRM HOD, SE2, GCS/CSS, dll)
- ✅ `roles` - 6 rows (HOD M1, Squad Lead, dll)
- ✅ `accounts` - 0 rows (akan diisi lewat UI)
- ✅ `activity_logs` - 0 rows (untuk audit trail)

### 4. Test Connection dari Next.js
```bash
npm run dev
```

Buka browser: http://localhost:3000

### 5. Test CRUD Operations

#### Test Applications Page
1. Klik menu **Settings** > **Applications**
2. Coba klik **Add Application**
3. Isi form dan save
4. Test Edit dan Delete button

#### Test Lines Page
1. Klik menu **Settings** > **Lines**
2. Test Add, Edit, Delete operations

#### Test Departments Page
1. Klik menu **Settings** > **Departments**
2. Test Add, Edit, Delete operations

#### Test Roles Page
1. Klik menu **Settings** > **Roles**
2. Test Add, Edit, Delete operations

#### Test Accounts Page
1. Klik menu **Accounts**
2. Klik **Add Account**
3. Pilih Application, Line, Department, Role dari dropdown
4. Isi Username dan Password
5. Save dan verify data muncul di table
6. Test Eye icon untuk show/hide password
7. Test Edit dan Delete operations

## 🔧 Troubleshooting

### Error: relation "applications" does not exist
- **Solusi**: Schema belum di-run. Ulangi Step 2.

### Error: Failed to fetch
- **Solusi**: 
  1. Pastikan `.env.local` sudah ada dan berisi credentials yang benar
  2. Restart development server: `Ctrl+C` lalu `npm run dev`

### Error: 401 Unauthorized
- **Solusi**: 
  1. Cek API Key di `.env.local`
  2. Pastikan RLS policies sudah di-enable (lihat schema)

### Data tidak muncul di table
- **Solusi**:
  1. Buka Browser DevTools (F12)
  2. Cek Console untuk error messages
  3. Cek Network tab untuk API responses

## 📁 File Structure

```
├── database/
│   ├── schema.sql              # Schema lengkap dengan sample data
│   └── schema-simple.sql       # Schema simple untuk quick start ✅
├── lib/
│   └── supabase.ts             # Supabase client config
├── app/
│   ├── api/
│   │   ├── applications/       # API routes untuk Applications
│   │   ├── lines/              # API routes untuk Lines
│   │   ├── departments/        # API routes untuk Departments
│   │   ├── roles/              # API routes untuk Roles
│   │   └── accounts/           # API routes untuk Accounts
│   └── (dashboard)/
│       ├── applications/       # Applications CRUD page
│       ├── lines/              # Lines CRUD page
│       ├── departments/        # Departments CRUD page
│       ├── roles/              # Roles CRUD page
│       └── accounts/           # Accounts CRUD page (kompleks)
└── components/
    └── ui/
        ├── dialog.tsx          # Dialog component untuk modals
        ├── label.tsx           # Label component untuk forms
        └── textarea.tsx        # Textarea component untuk forms
```

## ✅ Checklist Feature yang Sudah Selesai

### Backend
- [x] Supabase configuration
- [x] Database schema (6 tables)
- [x] Row Level Security policies
- [x] API routes untuk Applications (GET, POST, PUT, DELETE)
- [x] API routes untuk Lines (GET, POST, PUT, DELETE)
- [x] API routes untuk Departments (GET, POST, PUT, DELETE)
- [x] API routes untuk Roles (GET, POST, PUT, DELETE)
- [x] API routes untuk Accounts dengan relasi lengkap (GET, POST, PUT, DELETE)

### Frontend
- [x] Dialog/Modal components (reusable)
- [x] Form components (Label, Input, Textarea)
- [x] Applications page dengan full CRUD
- [x] Lines page dengan full CRUD
- [x] Departments page dengan full CRUD
- [x] Roles page dengan full CRUD
- [x] Accounts page dengan full CRUD + dropdown relasi
- [x] Password show/hide toggle
- [x] Dark theme dengan warna hijau-putih
- [x] Sidebar dengan collapsible Settings submenu
- [x] Consistent table styling

## 🎨 UI Features

1. **Dark Theme** - Background gelap dengan accent hijau
2. **Consistent Spacing** - Semua tabel punya spacing yang sama
3. **Hover Effects** - Row hover dan button hover states
4. **Loading States** - Loading indicator saat fetch data
5. **Empty States** - Message saat data kosong
6. **Form Validation** - Required fields validation
7. **Responsive Design** - Mobile-friendly layout
8. **Icon Actions** - Edit dan Delete dengan icon buttons

## 🚀 Next Steps (Optional)

1. **Authentication** - Implement NextAuth.js untuk login
2. **Search & Filter** - Implement search dan filter functionality
3. **Pagination** - Add pagination untuk large datasets
4. **Export Data** - Export ke Excel/CSV
5. **Audit Logs** - Track semua changes di activity_logs table
6. **Bulk Operations** - Bulk delete, bulk update
7. **Data Validation** - Server-side validation yang lebih ketat

## 📞 Support

Jika ada error atau pertanyaan, screenshot error message dari:
1. Browser Console (F12 > Console tab)
2. Network tab (F12 > Network tab)
3. Terminal output

Happy coding! 🎉

