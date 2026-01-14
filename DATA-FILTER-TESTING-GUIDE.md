# 🔐 Data-Level Filtering (Row-Level Security) - Testing Guide

## 📋 Overview

**Data-Level Filtering** sudah diimplementasikan! Sekarang role dapat membatasi **data mana yang bisa dilihat** oleh operator, bukan hanya permissions untuk actions.

### Contoh Use Cases:
- ✅ Role "Viewer SBMY" → hanya bisa lihat accounts dengan **Line = SBMY**
- ✅ Role "Admin CRM" → hanya bisa lihat accounts dengan **Department = CRM_HOD**
- ✅ Role "Manager HWBO" → hanya bisa lihat accounts dengan **Application = HWBO**
- ✅ Role kombinasi → hanya bisa lihat accounts dengan **Line = SBMY** DAN **Department = CRM_HOD**

---

## 🚀 Setup Database

### Step 1: Run Database Migration

Jalankan SQL script untuk menambahkan kolom data filter ke database:

```bash
# Di Supabase SQL Editor, jalankan file ini:
database/add-data-filters-to-permissions.sql
```

**Script ini akan:**
- Tambahkan 4 kolom baru ke `operator_role_permissions`:
  - `allowed_applications` (JSONB)
  - `allowed_lines` (JSONB)
  - `allowed_departments` (JSONB)
  - `allowed_roles` (JSONB)
- Create indexes untuk faster filtering
- Tambahkan comments untuk dokumentasi

### Step 2: Verify Database Update

Check di Supabase → Table Editor → `operator_role_permissions`:

**Expected Columns:**
```
id
role_id
menu_name
can_view
can_create
can_edit
can_delete
can_enable_disable
can_import
can_export
visible_columns (JSONB)
allowed_applications (JSONB) ← NEW
allowed_lines (JSONB) ← NEW
allowed_departments (JSONB) ← NEW
allowed_roles (JSONB) ← NEW
created_at
updated_at
```

---

## 🧪 Testing Scenario 1: Filter by LINE only (SBMY)

### Setup Role
1. Login sebagai **Super Admin**
2. Go to **Operators → Roles**
3. Click "**Add New Role**"
   - Role Code: `VIEWER_SBMY`
   - Role Name: `Viewer SBMY Only`
   - Description: `Can only view accounts with line SBMY`
   - Status: `Active`
4. Click "**Add Role**"

### Set Permissions
1. Click "**Manage Permissions**" untuk role "Viewer SBMY Only"
2. **Dashboard Permission:**
   - ✅ Can View: `true`
   - Semua lainnya: `false`
3. **Accounts Permission:**
   - ✅ Can View: `true`
   - ❌ Can Create: `false`
   - ❌ Can Edit: `false`
   - ❌ Can Delete: `false`
   - ❌ Can Enable/Disable: `false`
   - ❌ Can Import: `false`
   - ❌ Can Export: `false`
   - **Visible Columns:** Select all atau specific columns
   - **Data Filters:**
     - Allowed Applications: (leave empty)
     - **Allowed Lines: ✅ Check SBMY ONLY**
     - Allowed Departments: (leave empty)
     - Allowed Roles: (leave empty)
4. Click "**Save Permissions**"

### Create Test Operator
1. Go to **Operators → Operators**
2. Click "**Add New Operator**"
   - Full Name: `Test SBMY Viewer`
   - Username: `sbmyviewer`
   - Password: `password123`
   - Role: **Viewer SBMY Only**
   - Status: `Active`
3. Click "**Add Operator**"

### Test Filtering
1. **Logout** dari Super Admin
2. **Login** dengan:
   - Username: `sbmyviewer`
   - Password: `password123`
3. Go to **Accounts** page

**✅ Expected Results:**
- Hanya show accounts dengan **Line = SBMY**
- TIDAK show accounts dengan Line = LVMY, STMY, atau lainnya
- Filter di page masih berfungsi (untuk search, dll)

---

## 🧪 Testing Scenario 2: Filter by DEPARTMENT only (CRM)

### Setup Role
1. Login sebagai **Super Admin**
2. Go to **Operators → Roles**
3. Click "**Add New Role**"
   - Role Code: `ADMIN_CRM`
   - Role Name: `Admin CRM Department`
   - Description: `Can manage accounts in CRM department only`
   - Status: `Active`
4. Click "**Add Role**"

### Set Permissions
1. Click "**Manage Permissions**" untuk role "Admin CRM Department"
2. **Dashboard Permission:**
   - ✅ Can View: `true`
3. **Accounts Permission:**
   - ✅ Can View: `true`
   - ✅ Can Create: `true`
   - ✅ Can Edit: `true`
   - ❌ Can Delete: `false` (no delete permission)
   - ✅ Can Enable/Disable: `true`
   - **Visible Columns:** Select all
   - **Data Filters:**
     - Allowed Applications: (leave empty)
     - Allowed Lines: (leave empty)
     - **Allowed Departments: ✅ Check CRM_HOD ONLY**
     - Allowed Roles: (leave empty)
4. Click "**Save Permissions**"

### Create Test Operator
1. Click "**Add New Operator**"
   - Full Name: `Test CRM Admin`
   - Username: `crmadmin`
   - Password: `password123`
   - Role: **Admin CRM Department**
   - Status: `Active`

### Test Filtering
1. **Logout**
2. **Login** dengan `crmadmin` / `password123`
3. Go to **Accounts** page

**✅ Expected Results:**
- Hanya show accounts dengan **Department = CRM_HOD**
- TIDAK show accounts dengan Department = CS_AGENT, CS_HOD, SALES, dll
- ✅ Ada button "Add Account"
- ✅ Ada button "Edit" di Actions
- ❌ TIDAK ada button "Delete"
- ✅ Ada button "Enable/Disable"

---

## 🧪 Testing Scenario 3: Filter by APPLICATION only (HWBO)

### Setup Role
1. Login sebagai **Super Admin**
2. Create role: `MANAGER_HWBO`
   - Role Name: `Manager HWBO Application`
   - Description: `Can manage accounts for HWBO app only`

### Set Permissions
- **Accounts Permission:**
  - ✅ All permissions enabled (View, Create, Edit, Delete, Enable/Disable, Import)
  - **Data Filters:**
     - **Allowed Applications: ✅ Check HWBO ONLY**
     - Allowed Lines: (leave empty)
     - Allowed Departments: (leave empty)
     - Allowed Roles: (leave empty)

### Create Test Operator
- Username: `hwbomanager`
- Role: **Manager HWBO Application**

### Test Filtering
**✅ Expected Results:**
- Hanya show accounts dengan **Application = HWBO**
- TIDAK show accounts dengan Application = SCRM, Office Gram, dll
- ✅ Full permissions (Add, Edit, Delete, Import, Enable/Disable)

---

## 🧪 Testing Scenario 4: KOMBINASI Filters (Line + Department)

### Setup Role
1. Create role: `VIEWER_SBMY_CRM`
   - Role Name: `Viewer SBMY + CRM Only`
   - Description: `Can only view SBMY line AND CRM department`

### Set Permissions
- **Accounts Permission:**
  - ✅ Can View: `true` only
  - **Data Filters:**
     - **Allowed Lines: ✅ SBMY**
     - **Allowed Departments: ✅ CRM_HOD**
     - (Others empty)

### Create Test Operator
- Username: `sbmycrmviewer`
- Role: **Viewer SBMY + CRM Only**

### Test Filtering
**✅ Expected Results:**
- Hanya show accounts yang:
  - **Line = SBMY** DAN
  - **Department = CRM_HOD**
- TIDAK show accounts dengan Line = SBMY tapi Department lain
- TIDAK show accounts dengan Department = CRM_HOD tapi Line lain

---

## 🧪 Testing Scenario 5: Empty Filters = See ALL

### Setup Role
1. Create role: `ADMIN_ALL`
   - Role Name: `Admin All Data`
   - Description: `Can manage all accounts (no data filters)`

### Set Permissions
- **Accounts Permission:**
  - ✅ All permissions enabled
  - **Data Filters:**
     - Allowed Applications: ⬜ (empty)
     - Allowed Lines: ⬜ (empty)
     - Allowed Departments: ⬜ (empty)
     - Allowed Roles: ⬜ (empty)

### Create Test Operator
- Username: `adminall`
- Role: **Admin All Data**

### Test Filtering
**✅ Expected Results:**
- ✅ Bisa lihat **SEMUA accounts** tanpa filter
- ✅ Full permissions (Add, Edit, Delete, Import, Enable/Disable)

---

## 📊 Verify Data Filtering in Database

Untuk verify bahwa filtering berjalan di server-side, check query yang dijalankan:

### Manual Verification:

1. Login sebagai operator dengan data filter (e.g., `sbmyviewer`)
2. Open browser **DevTools → Network tab**
3. Refresh Accounts page
4. Check request ke `/api/accounts`:
   - Headers should include: `X-Operator-Id: <operator_id>`

### Database Check:

```sql
-- Check permissions for a specific role
SELECT 
  menu_name,
  allowed_applications,
  allowed_lines,
  allowed_departments,
  allowed_roles
FROM operator_role_permissions
WHERE role_id = '<role_id>';

-- Expected output for SBMY viewer:
-- menu_name: "Accounts"
-- allowed_lines: ["<line_id_for_sbmy>"]
-- Others: [] or NULL
```

---

## 🎯 Implementation Details

### Files Modified:
1. ✅ **`database/add-data-filters-to-permissions.sql`** - Database migration
2. ✅ **`lib/permissions.ts`** - Added `getAllowedFilters()` and `hasDataFilters()`
3. ✅ **`app/api/accounts/route.ts`** - Server-side filtering logic
4. ✅ **`app/(dashboard)/accounts/page.tsx`** - Send operator ID in headers
5. ✅ **`app/(dashboard)/operator-roles/page.tsx`** - UI for data filters

### How It Works:

**Frontend → Backend Flow:**
```
1. User opens Accounts page
2. Frontend gets operator ID from localStorage
3. Frontend sends GET /api/accounts with header "X-Operator-Id"
4. Backend checks operator's role
5. Backend fetches permissions from operator_role_permissions
6. Backend applies .in() filters to Supabase query
7. Backend returns filtered data only
8. Frontend displays filtered accounts
```

**Security:**
- ✅ Filtering is done **SERVER-SIDE** (secure)
- ✅ Users cannot bypass filters by tampering with localStorage
- ✅ Empty arrays = no filter (show all)
- ✅ Super Admin always bypasses filters

---

## ⚠️ Important Notes

1. **Empty Array Behavior:**
   - `[]` or `null` = **No filter** (show all data)
   - `["id1"]` = **Filter applied** (show only matching data)

2. **Kombinasi Filters:**
   - Multiple filters act as **AND** logic
   - Example: Line = SBMY AND Department = CRM
   - Only accounts matching **BOTH** conditions are shown

3. **Super Admin:**
   - Super Admin role **ALWAYS bypasses** data filters
   - Super Admin can see **ALL data** regardless of filters

4. **Performance:**
   - Database indexes added for faster filtering
   - Filters use `.in()` operator (very efficient)

---

## 🐛 Troubleshooting

### Problem: Operator can still see all data (filter tidak apply)

**Solutions:**
1. Check database migration sudah dijalankan
2. Check permissions di database:
   ```sql
   SELECT * FROM operator_role_permissions WHERE menu_name = 'Accounts';
   ```
3. Check operator's role_id match dengan permissions
4. Restart dev server: `npm run dev`
5. Clear browser cache dan re-login

### Problem: No data shown (too restricted)

**Solutions:**
1. Check apakah filter terlalu ketat (kombinasi yang tidak match)
2. Check apakah accounts exist dengan filter values tersebut
3. Temporarily set all filters to empty `[]` untuk test

### Problem: Permission save tidak update filters

**Solutions:**
1. Check browser console untuk errors
2. Check API response dari PUT `/api/operator-roles/:id/permissions`
3. Verify data structure di database match dengan expected format

---

## ✅ Success Checklist

- [ ] Database migration berhasil dijalankan
- [ ] Kolom `allowed_applications`, `allowed_lines`, `allowed_departments`, `allowed_roles` exist di `operator_role_permissions` table
- [ ] UI untuk data filters muncul di Operator Roles → Manage Permissions
- [ ] Checkbox untuk Applications, Lines, Departments, Roles berfungsi
- [ ] Save permissions berhasil save data filters
- [ ] Login sebagai operator dengan filters hanya show filtered data
- [ ] Super Admin masih bisa lihat semua data
- [ ] Empty filters = show all data

---

## 🎉 Next Steps

Setelah data filtering berfungsi untuk **Accounts**, Anda bisa extend ke menu lain:

1. **Applications** - Filter by specific applications only
2. **Lines** - Filter by specific lines only
3. **Departments** - Filter by specific departments only
4. **Roles** - Filter by specific roles only

**Implementation sama:**
1. Add data filter UI di operator-roles page
2. Update API route untuk apply filters
3. Update frontend page untuk send operator ID

---

**Status:** ✅ Data-Level Filtering 100% Ready for Testing!

Test sekarang dengan scenarios di atas, dan laporkan kalau ada masalah! 🚀

