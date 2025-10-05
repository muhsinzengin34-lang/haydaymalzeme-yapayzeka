@echo off
echo ========================================
echo GitHub'a Yukleme Basladi
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Git init...
git init

echo.
echo [2/5] Dosyalari ekleniyor...
git add .

echo.
echo [3/5] Commit yapiliyor...
git commit -m "Initial commit - Hay Day Destek Chatbot v2.0"

echo.
echo [4/5] GitHub repository URL'ini girin:
echo Ornek: https://github.com/kullaniciadi/hayday-destek-chatbot.git
set /p REPO_URL="Repository URL: "

echo.
echo [5/5] GitHub'a push yapiliyor...
git remote add origin %REPO_URL%
git branch -M main
git push -u origin main

echo.
echo ========================================
echo TAMAMLANDI!
echo ========================================
echo.
echo GitHub'da projenizi gorebilirsiniz.
echo.
pause
