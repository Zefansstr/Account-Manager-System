@echo off
REM Script batch untuk sync project dari GitHub
REM Double-click file ini untuk sync project

echo ========================================
echo Sync Project dari GitHub
echo Repository: Account-Manager-System
echo ========================================
echo.

cd /d "d:\Account Manager"

powershell.exe -ExecutionPolicy Bypass -File "%~dp0sync-from-git.ps1"

pause
