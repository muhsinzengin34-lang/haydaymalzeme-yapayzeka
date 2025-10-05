@echo off
chcp 65001 >nul
echo ╔════════════════════════════════════════╗
echo ║   GITHUB OTOMATIK YÜKLEME             ║
echo ╚════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1/7] Git kontrol...
where git >nul 2>&1
if errorlevel 1 (
    echo ❌ Git bulunamadı!
    echo.
    echo Git indiriliyor...
    start https://git-scm.com/download/win
    echo.
    echo Git kurduktan sonra bu scripti tekrar çalıştır.
    pause
    exit /b 1
)

echo ✅ Git bulundu
echo.

echo [2/7] Git yapılandırma...
git config user.name "muhsinzengin34-lang"
git config user.email "muhsinzengin34@gmail.com"

echo [3/7] Git init...
if not exist .git (
    git init
    echo ✅ Git başlatıldı
) else (
    echo ✅ Git zaten başlatılmış
)

echo [4/7] Dosyaları ekleme...
git add .
echo ✅ Dosyalar eklendi

echo [5/7] Commit...
git commit -m "🎯 Lean Mode: AI Chatbot sistemi hazır"
echo ✅ Commit yapıldı

echo [6/7] Branch ayarlama...
git branch -M main
echo ✅ Branch: main

echo [7/7] Remote ve Push...
echo.
echo GitHub repository oluşturuldu mu?
echo 1. https://github.com/new
echo 2. Repository adı: haydaymalzeme-yapayzeka
echo 3. Create repository
echo.
choice /C YN /M "Repository oluşturuldu mu (Y/N)"

if errorlevel 2 (
    echo.
    echo Repository oluştur ve scripti tekrar çalıştır.
    pause
    exit /b 0
)

echo.
echo Remote ekleniyor...
git remote remove origin 2>nul
git remote add origin https://github.com/muhsinzengin34-lang/haydaymalzeme-yapayzeka.git

echo.
echo Push yapılıyor...
echo.
echo ⚠️ GitHub kullanıcı adı ve şifre/token sorulacak!
echo.
git push -u origin main

if errorlevel 1 (
    echo.
    echo ❌ Push başarısız!
    echo.
    echo Token ile dene:
    echo git push https://YOUR_TOKEN@github.com/muhsinzengin34-lang/haydaymalzeme-yapayzeka.git main
    echo.
    echo Token oluştur: https://github.com/settings/tokens
    pause
    exit /b 1
)

echo.
echo ╔════════════════════════════════════════╗
echo ║   ✅ BAŞARILI!                        ║
echo ╚════════════════════════════════════════╝
echo.
echo Repository: https://github.com/muhsinzengin34-lang/haydaymalzeme-yapayzeka
echo.
pause
