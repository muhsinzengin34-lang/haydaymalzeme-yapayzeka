@echo off
cd /d "%~dp0"

echo GitHub'a yukleniyor...
echo.

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/muhsinzengin34-lang/haydaymalzeme-yapayzeka.git
git push -u origin main

echo.
echo Tamamlandi!
pause
