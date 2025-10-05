@echo off
chcp 65001 >nul
echo ========================================
echo GitHub'a Yükleme Scripti
echo ========================================
echo.

REM Git kontrolü
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git yüklü değil!
    echo.
    echo Git'i yüklemek için: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo ✅ Git yüklü
echo.

REM Kullanıcıdan GitHub bilgilerini al
set /p GITHUB_USERNAME="GitHub kullanıcı adınız: "
set /p REPO_NAME="Repository adı (varsayılan: haydaymalzeme-yapayzeka): "

if "%REPO_NAME%"=="" set REPO_NAME=haydaymalzeme-yapayzeka

echo.
echo ========================================
echo Repository: https://github.com/%GITHUB_USERNAME%/%REPO_NAME%
echo ========================================
echo.

REM Git işlemleri
echo [1/6] Git repository başlatılıyor...
git init

echo [2/6] Dosyalar ekleniyor...
git add .

echo [3/6] İlk commit yapılıyor...
git commit -m "İlk commit: Hay Day Destek Chatbot sistemi"

echo [4/6] Ana branch main olarak ayarlanıyor...
git branch -M main

echo [5/6] GitHub repository bağlanıyor...
git remote add origin https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git

echo [6/6] GitHub'a yükleniyor...
git push -u origin main

echo.
echo ========================================
echo ✅ Başarıyla yüklendi!
echo ========================================
echo.
echo Repository: https://github.com/%GITHUB_USERNAME%/%REPO_NAME%
echo.
echo Sonraki adımlar:
echo 1. .env dosyası oluşturun: copy .env.example .env
echo 2. .env dosyasını düzenleyin ve API anahtarlarınızı ekleyin
echo 3. Bağımlılıkları yükleyin: npm install
echo 4. Sistemi başlatın: npm run dev
echo.
pause
