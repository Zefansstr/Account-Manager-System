# Account Management System

Sistem manajemen akun sederhana untuk mengelola users dengan struktur Line, Username, Password, Department/Team, Role, dan Remark.

## 🚀 Tech Stack

- **Frontend**: Next.js 15.1.3 + TypeScript
- **Styling**: Tailwind CSS v3.3.0
- **UI Components**: Custom components (Button, Card, Badge, Input)
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js (Coming soon)
- **Form Handling**: React Hook Form + Zod
- **Tables**: TanStack Table v8

## 📦 Installation

1. Clone repository atau buka folder project ini

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
   - Copy `.env.example` menjadi `.env`
   - Isi dengan credentials Supabase Anda

4. Run development server:
```bash
npm run dev
```

5. Buka browser ke `http://localhost:3000`

## 🗄️ Database Structure

Sistem ini menggunakan struktur sederhana dengan 5 tables:

### 1. **lines** - Lines Management
- SBMY, LVMY, MYR, SGD

### 2. **departments** - Departments/Teams
- CRM HOD, SE2, GCS/CSS, SNR, TE, PPC, XBPO SE2, XBPO Cashier

### 3. **roles** - User Roles
- HOD - M1 Above
- Squad Lead
- Squad Team
- PPC Team
- XBPO Team
- XBPO Cashier

### 4. **accounts** - Main Table (6 Fields)
- **Line** (Foreign Key to lines)
- **Username** (Unique)
- **Password** (Hashed)
- **Department/Team** (Foreign Key to departments)
- **Role** (Foreign Key to roles)
- **Remark** (Optional notes)

### 5. **activity_logs** - Audit Trail
- Track semua perubahan untuk audit

## 🗄️ Supabase Database Setup

### Step 1: Buat Project di Supabase

1. Pergi ke [https://supabase.com](https://supabase.com)
2. Login atau Sign up
3. Klik "New Project"
4. Isi:
   - **Name**: account-management
   - **Database Password**: (simpan password ini!)
   - **Region**: Southeast Asia (Singapore)
5. Tunggu project selesai dibuat (~2 menit)

### Step 2: Dapatkan API Keys

1. Di dashboard Supabase, pergi ke **Settings** > **API**
2. Copy credentials berikut:
   - `Project URL` → untuk `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → untuk `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → untuk `SUPABASE_SERVICE_ROLE_KEY`

3. Paste ke file `.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 3: Run Database Schema

1. Di Supabase dashboard → **SQL Editor**
2. Klik "New query"
3. Copy semua isi file `database/schema.sql`
4. Paste dan klik **"Run"**
5. Tunggu sampai selesai

Database akan dibuat dengan:
- ✅ 4 Lines (SBMY, LVMY, MYR, SGD)
- ✅ 8 Departments
- ✅ 6 Roles
- ✅ 20 Sample accounts

## 📁 Project Structure

```
account-management/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard layout dengan Topbar + Sidebar
│   │   ├── dashboard/              # Dashboard page dengan KPI cards
│   │   ├── accounts/               # Accounts management (6 kolom)
│   │   ├── lines/                  # Lines management
│   │   ├── departments/            # Departments management
│   │   ├── roles/                  # Roles management
│   │   ├── audit-logs/             # Audit logs page
│   │   └── settings/               # Settings page
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Root page (redirect ke dashboard)
├── components/
│   ├── ui/                         # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── input.tsx
│   ├── layout/                     # Layout components
│   │   ├── topbar.tsx
│   │   └── sidebar.tsx
│   └── dashboard/
│       └── stat-card.tsx           # KPI stat card component
├── lib/
│   ├── supabase.ts                 # Supabase client
│   └── utils.ts                    # Utility functions
├── database/
│   └── schema.sql                  # Complete database schema
├── .env                            # Environment variables (jangan commit!)
├── .env.example                    # Template environment variables
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## 🎯 Features

### ✅ Completed (Phase 1)
- [x] Next.js 15 + TypeScript setup
- [x] Tailwind CSS v3.3.0 configuration
- [x] Dashboard layout (Topbar + Sidebar)
- [x] Dashboard page dengan 4 KPI cards
- [x] Accounts page dengan 6 kolom + filters + search
- [x] Lines management page
- [x] Departments management page
- [x] Roles management page
- [x] Password show/hide functionality
- [x] Row selection & batch operations UI
- [x] Supabase integration setup
- [x] Database schema (5 tables)
- [x] Sample data (20 accounts)

### 🚧 Coming Soon (Phase 2)
- [ ] Connect Accounts page ke Supabase real data
- [ ] Add/Edit/Delete Account dengan modal form
- [ ] Add/Edit/Delete Lines
- [ ] Add/Edit/Delete Departments
- [ ] Add/Edit/Delete Roles
- [ ] Batch delete functionality
- [ ] Export to Excel/CSV
- [ ] Import from Excel/CSV
- [ ] Authentication system (Login/Logout)
- [ ] User permissions
- [ ] Audit logs dengan filtering

## 📊 Pages Overview

### 1. Dashboard (`/dashboard`)
- 4 KPI cards (Total Accounts, Lines, Departments, Roles)
- Accounts by Line (bar chart)
- Recent Activity log
- Accounts by Department
- Accounts by Role

### 2. Accounts (`/accounts`)
**6 Kolom Utama:**
1. Line (Badge)
2. Username (Link)
3. Password (Hidden dengan show/hide toggle)
4. Department/Team
5. Role
6. Remark

**Features:**
- Search by username or line
- Filter by Line, Department, Role
- Row selection (checkboxes)
- Batch delete
- Edit & Delete per row
- Pagination

### 3. Lines (`/lines`)
- View all lines (SBMY, LVMY, MYR, SGD)
- Add new line
- Edit/Delete line
- Show account count per line

### 4. Departments (`/departments`)
- List all departments
- Add/Edit/Delete departments
- Show account count per department

### 5. Roles (`/roles`)
- List all roles
- Add/Edit/Delete roles
- Show account count per role

### 6. Audit Logs (`/audit-logs`)
- Track all activities (create, update, delete)
- Filter by date, user, action

### 7. Settings (`/settings`)
- System settings
- User profile
- Password change

## 🔗 API Endpoints (Planned)

```
Accounts:
GET    /api/accounts              # List dengan pagination & filters
GET    /api/accounts/:id          # Get detail
POST   /api/accounts              # Create new
PUT    /api/accounts/:id          # Update
DELETE /api/accounts/:id          # Delete
POST   /api/accounts/batch-delete # Batch delete

Lines:
GET    /api/lines                 # List all lines
POST   /api/lines                 # Create
PUT    /api/lines/:id             # Update
DELETE /api/lines/:id             # Delete

Departments:
GET    /api/departments           # List all departments
POST   /api/departments           # Create
PUT    /api/departments/:id       # Update
DELETE /api/departments/:id       # Delete

Roles:
GET    /api/roles                 # List all roles
POST   /api/roles                 # Create
PUT    /api/roles/:id             # Update
DELETE /api/roles/:id             # Delete

Audit:
GET    /api/audit-logs            # List logs dengan filters
```

## 📝 Next Steps

### Priority 1: Connect Real Data
1. Create API routes untuk accounts CRUD
2. Fetch data dari Supabase
3. Implement pagination server-side
4. Replace dummy data dengan real data

### Priority 2: CRUD Operations
1. Add Account modal dengan form validation
2. Edit Account functionality
3. Delete Account dengan confirmation
4. Lines CRUD
5. Departments CRUD
6. Roles CRUD

### Priority 3: Advanced Features
1. Batch operations (delete multiple)
2. Export to Excel
3. Import from Excel/CSV
4. Audit logs implementation
5. Authentication & authorization

## 🤝 Contributing

Project ini sedang dalam development aktif. Untuk contribute atau request fitur, silakan hubungi team.

## 📄 License

Private project untuk internal use.
