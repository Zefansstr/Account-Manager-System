# Script untuk sync project dari GitHub repository
# Jalankan script ini secara berkala untuk mendapatkan update terbaru

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sync Project dari GitHub" -ForegroundColor Cyan
Write-Host "Repository: Account-Manager-System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate ke project directory
$projectPath = "d:\Account Manager"
Set-Location $projectPath

# Fetch update dari remote
Write-Host "[1/3] Fetching updates dari GitHub..." -ForegroundColor Yellow
git fetch origin

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Gagal fetch dari GitHub!" -ForegroundColor Red
    exit 1
}

# Cek apakah ada update
$localCommit = git rev-parse HEAD
$remoteCommit = git rev-parse origin/main

if ($localCommit -eq $remoteCommit) {
    Write-Host "[2/3] Project sudah up-to-date!" -ForegroundColor Green
    Write-Host "Tidak ada perubahan baru." -ForegroundColor Green
} else {
    Write-Host "[2/3] Update ditemukan! Melakukan sync..." -ForegroundColor Yellow
    
    # Reset hard ke remote (timpa semua perubahan lokal)
    Write-Host "Menimpa perubahan lokal dengan versi terbaru..." -ForegroundColor Yellow
    git reset --hard origin/main
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Gagal reset ke remote!" -ForegroundColor Red
        exit 1
    }
    
    # Clean untracked files (optional)
    Write-Host "Membersihkan file yang tidak ter-track..." -ForegroundColor Yellow
    git clean -fd
    
    Write-Host "[3/3] Sync berhasil!" -ForegroundColor Green
    Write-Host "Project telah diupdate ke versi terbaru." -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sync selesai!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
