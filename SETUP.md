# 🚀 Quick Setup Guide

## Langkah-langkah Setup Account Management System

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Setup Supabase

#### A. Buat Project Supabase
1. Pergi ke https://supabase.com
2. Login/Sign up
3. Klik "New Project"
4. Isi:
   - Name: `account-management`
   - Database Password: (catat password ini!)
   - Region: `Southeast Asia (Singapore)`
5. Tunggu ~2 menit sampai project ready

#### B. Dapatkan API Keys
1. Di Supabase dashboard → **Settings** → **API**
2. Copy:
   - **Project URL**
   - **anon public key**
   - **service_role key** (di bagian bawah)

#### C. Setup Environment Variables
1. Copy file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` dan isi dengan credentials Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

### 3️⃣ Setup Database

1. Di Supabase dashboard → **SQL Editor**
2. Klik "New query"
3. Copy semua isi file `database/schema.sql`
4. Paste ke SQL Editor
5. Klik **"Run"** atau tekan `Ctrl+Enter`
6. Tunggu sampai selesai (~10 detik)

**Yang akan dibuat:**
- ✅ 4 Lines (SBMY, LVMY, MYR, SGD)
- ✅ 8 Departments (CRM HOD, SE2, GCS/CSS, SNR, TE, PPC, XBPO SE2, XBPO Cashier)
- ✅ 6 Roles (HOD, Squad Lead, Squad Team, PPC Team, XBPO Team, XBPO Cashier)
- ✅ 20 Sample accounts

### 4️⃣ Run Development Server

```bash
npm run dev
```

Server akan berjalan di: **http://localhost:3000**

### 5️⃣ Test Website

1. Buka browser ke `http://localhost:3000`
2. Anda akan otomatis redirect ke `/dashboard`
3. Coba klik menu:
   - **Dashboard** - lihat 4 KPI cards + charts
   - **Accounts** - lihat data table dengan 20 sample accounts (6 kolom)
   - **Lines** - lihat 4 lines (SBMY, LVMY, MYR, SGD)
   - **Departments** - lihat 8 departments
   - **Roles** - lihat 6 roles

---

## ✅ Checklist Setup

- [ ] Dependencies installed (`npm install`)
- [ ] Supabase project created
- [ ] `.env` file configured dengan API keys
- [ ] Database schema di-run di Supabase SQL Editor
- [ ] Development server running (`npm run dev`)
- [ ] Website accessible di `http://localhost:3000`
- [ ] Dashboard page menampilkan KPI cards
- [ ] Accounts page menampilkan 20 accounts dengan 6 kolom
- [ ] Lines page menampilkan 4 lines
- [ ] Departments page menampilkan 8 departments
- [ ] Roles page menampilkan 6 roles

---

## 🎯 Struktur Database (Sederhana)

### Table Structure:

1. **lines** (4 records)
   - SBMY, LVMY, MYR, SGD

2. **departments** (8 records)
   - CRM HOD, SE2, GCS/CSS, SNR, TE, PPC, XBPO SE2, XBPO Cashier

3. **roles** (6 records)
   - HOD - M1 Above, Squad Lead, Squad Team, PPC Team, XBPO Team, XBPO Cashier

4. **accounts** (Main Table - 6 Fields)
   - Line (FK)
   - Username (Unique)
   - Password (Hashed)
   - Department (FK)
   - Role (FK)
   - Remark (Optional)

5. **activity_logs** (Audit Trail)
   - Track create, update, delete operations

---

## 📸 Features Yang Sudah Selesai

### Dashboard
✅ 4 KPI cards (Total Accounts, Lines, Departments, Roles)  
✅ Accounts by Line chart  
✅ Recent Activity log  
✅ Accounts by Department  
✅ Accounts by Role  

### Accounts Page
✅ Data table dengan 6 kolom  
✅ Search functionality  
✅ 3 Filters (Line, Department, Role)  
✅ Password show/hide toggle  
✅ Row selection checkboxes  
✅ Batch operations UI  
✅ Edit & Delete buttons  
✅ Pagination  

### Lines Page
✅ Card view untuk setiap line  
✅ Show account count  
✅ Edit & Delete buttons  

### Departments Page
✅ Table view dengan account count  
✅ Add/Edit/Delete buttons  

### Roles Page
✅ Table view dengan account count  
✅ Add/Edit/Delete buttons  

---

## 🚧 Next Steps (Yang Perlu Dilakukan)

### Phase 1: Connect Real Data (Priority)
1. Buat API route `/api/accounts`
2. Fetch data dari Supabase
3. Replace dummy data dengan real data
4. Implement pagination & sorting server-side

### Phase 2: CRUD Operations
1. Add Account modal & form
2. Edit Account functionality
3. Delete Account dengan confirmation
4. Lines CRUD
5. Departments CRUD
6. Roles CRUD

### Phase 3: Advanced Features
1. Batch delete implementation
2. Export to Excel/CSV
3. Import from Excel
4. Audit logs
5. Authentication system

---

## 🆘 Troubleshooting

### Error: Missing environment variables
**Solution**: Pastikan file `.env` sudah dibuat dan berisi semua variables yang diperlukan.

### Error: Cannot connect to Supabase
**Solution**: 
1. Check API keys di `.env` sudah benar
2. Check project Supabase masih active
3. Check internet connection
4. Test connection di Supabase dashboard → Settings → API

### Error: Tailwind CSS PostCSS plugin error
**Solution**: Sudah di-fix! Project ini menggunakan Tailwind CSS v3.3.0 yang stable dan kompatibel dengan Next.js 15. Jika error masih muncul:
1. Run `npm uninstall tailwindcss postcss autoprefixer`
2. Run `npm install -D tailwindcss@3.3.0 postcss@8.4.31 autoprefixer@10.4.16`
3. Delete folder `.next`
4. Run `npm run dev` lagi

### Error: npm run dev gagal
**Solution**:
1. Delete folder `node_modules` dan `.next`
2. Run `npm install` lagi
3. Run `npm run dev` lagi

### Page tidak menampilkan data
**Solution**: 
1. Check database schema sudah di-run
2. Check sample data sudah di-insert
3. Check di Supabase → Table Editor, pastikan data ada
4. Check console browser untuk error messages

### Database schema error
**Solution**:
1. Di Supabase SQL Editor, drop semua tables terlebih dahulu:
   ```sql
   DROP TABLE IF EXISTS activity_logs;
   DROP TABLE IF EXISTS accounts;
   DROP TABLE IF EXISTS roles;
   DROP TABLE IF EXISTS departments;
   DROP TABLE IF EXISTS lines;
   ```
2. Run ulang schema dari `database/schema.sql`

---

## 📞 Support

Jika ada masalah atau pertanyaan, silakan hubungi team development.

**Happy Coding! 🎉**
