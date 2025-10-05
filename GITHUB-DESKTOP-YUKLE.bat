@echo off
chcp 65001 >nul
echo ========================================
echo GitHub Desktop ile Yükleme
echo ========================================
echo.
echo Git komut satırı bulunamadı!
echo.
echo İki seçeneğiniz var:
echo.
echo 1) GitHub Desktop (Kolay - Önerilen)
echo    İndir: https://desktop.github.com
echo.
echo 2) Git Komut Satırı
echo    İndir: https://git-scm.com/download/win
echo.
echo ========================================
echo GitHub Desktop Adımları:
echo ========================================
echo.
echo 1. GitHub Desktop'ı indirin ve kurun
echo 2. GitHub hesabınızla giriş yapın
echo 3. File ^> Add Local Repository
echo 4. Bu klasörü seçin: %CD%
echo 5. Publish repository butonuna tıklayın
echo 6. Repository adı: haydaymalzeme-yapayzeka
echo 7. Public/Private seçin
echo 8. Publish butonuna tıklayın
echo.
echo ✅ Tamamlandı!
echo.
pause
start https://desktop.github.com
