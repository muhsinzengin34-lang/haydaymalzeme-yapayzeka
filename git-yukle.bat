@echo off
echo ========================================
echo   GITHUB YUKLEME SCRIPTI
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Git kontrolu...
git --version >nul 2>&1
if errorlevel 1 (
    echo HATA: Git yuklu degil!
    echo Git indirin: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [2/5] Git init...
git init

echo [3/5] Dosyalari ekleme...
git add .

echo [4/5] Commit...
git commit -m "🎯 Lean Mode: AI Chatbot sistemi hazir"

echo [5/5] Branch ayarlama...
git branch -M main

echo.
echo ========================================
echo   HAZIR!
echo ========================================
echo.
echo Simdi GitHub'da repository olustur:
echo 1. https://github.com/new
echo 2. Repository adi: haydaymalzeme-yapayzeka
echo 3. Create repository
echo.
echo Sonra su komutu calistir:
echo git remote add origin https://github.com/muhsinzengin34-lang/haydaymalzeme-yapayzeka.git
echo git push -u origin main
echo.
pause
