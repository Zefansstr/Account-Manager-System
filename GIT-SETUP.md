# Git Setup Instructions

## Setup Git Repository di Folder Ini

Jalankan perintah berikut di terminal (PowerShell atau Command Prompt):

### 1. Initialize Git Repository (jika belum ada)
```bash
git init
```

### 2. Tambahkan Remote Repository
```bash
git remote add origin https://github.com/Zefansstr/Account-Manager-System.git
```

### 3. Cek Remote (verifikasi)
```bash
git remote -v
```

### 4. Tambahkan Semua File
```bash
git add .
```

### 5. Commit Perubahan
```bash
git commit -m "Update: Add React Query, theme toggle, UI/UX improvements, background image, and performance optimizations"
```

### 6. Set Branch ke Main (jika perlu)
```bash
git branch -M main
```

### 7. Push ke GitHub
```bash
git push -u origin main
```

## Jika Remote Sudah Ada

Jika remote sudah ada tapi ingin update URL:
```bash
git remote set-url origin https://github.com/Zefansstr/Account-Manager-System.git
```

## Jika Ada Konflik

Jika ada konflik saat push:
```bash
# Pull dulu dari remote
git pull origin main --allow-unrelated-histories

# Atau force push (hati-hati!)
git push -u origin main --force
```

## Catatan

- Pastikan Git sudah terinstall di sistem
- Jika Git belum terinstall, download dari: https://git-scm.com/download/win
- Setelah install Git, restart terminal
- Untuk authentication, gunakan Personal Access Token (bukan password)
